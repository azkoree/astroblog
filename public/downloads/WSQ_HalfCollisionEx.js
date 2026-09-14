//=============================================================================
// GF Plugins (Extension by WSQ)
// WSQ_HalfCollisionEx.js
//=============================================================================
// 半格碰撞「图片检测」扩展：用一张按地图命名、以红色标出「不可通行区」的
// 碰撞图，替代 HalfMove 中不便的 Region（区域）半格碰撞设置。
//
// 碰撞判定遵循「直觉」：每个图块切成 2x2=4 个象限（每轴 2 等分，正对 HalfMove
// 的 tileUnit=0.5），判定时把坐标 floor 到它所在的象限，该象限在碰撞图中被红
// 填满（达阈值）即不可通行——画哪挡哪，无偏移。象限位约定（见 buildGrid）：
//   bit0=左上, bit1=右上, bit2=左下, bit3=右下。上半格涂红 => 上半不可通行。
//
// - 依赖：HalfMove.js（置于其后加载）。无 HalfMove 时不生效。
// - 显示：WSQ_CollisionDev 的「碰撞视角」逐格调用 isPassableByHalfRegionAndTag，
//   因此图片碰撞会直接显示在碰撞叠加层上。
//   ⚠ 注意 WSQ_CollisionDev 的「直觉绘制模式」读的是 Region（区域）而非本图片，
//   二者不冲突但也不互通；想看图片碰撞请用「碰撞视角」。用 WSQ.HCE.dumpMap() 可
//   在控制台直接打印每格挡格象限，用来确认方向是否如直觉。
//=============================================================================

var Imported = Imported || {};
Imported.WSQ_HalfCollisionEx = true;

var WSQ = WSQ || {};
WSQ.HCE = WSQ.HCE || {};
WSQ.HCE.version = 1.12;
WSQ.HCE.pluginName = document.currentScript.src.match(/([^\/]+)\.js/)[1];

/*:
 * @target MZ
 * @plugindesc [v1.12]        地图 - 半格碰撞图片检测（读取碰撞图，红色即不可通行，判定=直觉方向：画哪挡哪；移动足印已对齐不再偏移半格）
 * @author WSQ
 * @url
 * @base HalfMove
 * @orderAfter HalfMove
 *
 * @param 启用
 * @text 启用
 * @type boolean
 * @desc 总开关。开启后，凡是存在对应碰撞图的地图都改用图片判定半格碰撞；无图的地图仍走 HalfMove 区域设置。
 * @default true
 *
 * @param 图片目录
 * @text 图片目录
 * @type string
 * @desc 碰撞图所在目录（相对游戏根目录）。图片与地图按命名对应。
 * @default img/parallaxes/collision
 *
 * @param 文件名前缀
 * @text 文件名前缀
 * @type string
 * @desc 碰撞图文件名为「前缀 + 地图ID + .png」。如默认 map：地图1 对应 map1.png。
 * @default map
 *
 * @param 每格像素尺寸
 * @text 每格像素尺寸
 * @type number
 * @min 2
 * @desc 碰撞图中「一个地图格」对应的像素边长，必须为偶数（以便半格=整数像素）。例如设为 10 时，20x15 格地图的碰撞图应为 200x150 px。
 * @default 48
 *
 * @param 判定颜色
 * @text 判定颜色
 * @type string
 * @desc 判定为「不可通行」的颜色，十六进制写法。忽略透明度：半透明红色同样命中；完全透明的像素一律视为未设置、可通行。
 * @default #FF0000
 *
 * @param 颜色容差
 * @text 颜色容差
 * @type number
 * @min 0
 * @max 255
 * @desc 判定颜色时每个通道（R/G/B）允许的差值。0 表示严格匹配；如担心抗锯齿或轻微色差可适当调大。
 * @default 0
 *
 * @param 红色覆盖率阈值
 * @text 红色覆盖率阈值
 * @type number
 * @min 0.01
 * @max 1
 * @desc 子格内红色像素占比达到该值即判为「不可通行」。1/2 请填 0.5，1/4 请填 0.25。
 * @default 0.5
 *
 * @param 调试输出
 * @text 调试输出
 * @type boolean
 * @desc 在控制台输出本插件的读取/构建状态（是否读到图、阻挡象限数）。排查问题时开启，平时保持关闭以免刷屏。
 * @default false
 *
 * @help
 * ============================================================================
 *  介绍 / Introduction
 * ============================================================================
 *  本插件为 HalfMove.js 的扩展：HalfMove 用「区域(Region)编号」来标记半格/
 *  四分之一格的不可通行区，不直观且占用区域 ID。本插件改为读取一张「碰撞图」，
 *  红色即不可通行，半透明红色同样命中，完全透明即未设置。
 *
 *  碰撞判定遵循「直觉」：每个图块切成 2x2=4 个半格，判定时把角色坐标 floor 到
 *  它所在的子格，该子格在碰撞图中被红填满（达阈值）即不可通行。画哪挡哪，无偏移。
 *  因此「上半格涂红 -> 上半不可通行；左下涂红 -> 左下不可通行」，象限方向直观。
 *  移动时覆写 HalfMove 的足印为「目标格完整2x2」，保证角色全身被校验，块停在墙顶、
 *  不会比图片低半格。⚠ WSQ_CollisionDev 的「直觉绘制模式」读的是 Region，不读本图片；
 *  想看图片碰撞请用其「碰撞视角」（默认）。用 WSQ.HCE.dumpMap() 可打印挡格象限图核对。
 *
 * ============================================================================
 *  碰撞图规格 / Collision Image Spec
 * ============================================================================
 *  • 目录：默认 img/parallaxes/collision（可在参数修改）。
 *  • 命名：默认「map + 地图ID + .png」，例如地图 1 -> img/parallaxes/collision/map1.png。
 *  • 尺寸：碰撞图宽 = 地图宽(格) × 「每格像素尺寸」，高同理。
 *      例：地图 20x15 格、每格 10px -> 碰撞图 200x150 px。
 *  • 粒度：每图块 2x2=4 个半格（正对 HalfMove 的 tileUnit=0.5）。
 *      每半格像素尺寸 = 「每格像素尺寸」÷ 2（每格 10px 时半格 5x5px）。
 *  • 判定：半格内红色像素占比 ≥ 「红色覆盖率阈值」-> 该半格不可通行。
 *  • 对齐：子格采样按「目标色块就近像素」处理；子格超出图片范围的部分按
 *      「可通行」处理（缺数据不误挡）。
 *
 * ============================================================================
 *  优先级说明 / Priority
 * ============================================================================
 *  • 有碰撞图（且能读像素）：该地图半格碰撞只由图片判定，Region 设置被忽略。
 *  • 无碰撞图 / 读取失败：退回 HalfMove 区域判定（原行为）。
 *  • 整格(全图块)是否可通行仍由 RMMZ 编辑器瓦片通行设置决定，图片只会「更紧」
 *    不会「更松」，不会放开本就被编辑器挡住的格。
 *
 * ============================================================================
 *  兼容性 / Compatibility
 * ============================================================================
 *  • HalfMove：覆写其 Game_Map.isPassableByHalfRegionAndTag 一个方法，不修改本体。
 *  • WSQ_CollisionDev：其「碰撞视角」逐格调用同一条方法，会自动可视化图片碰撞。
 *    其「直觉绘制模式」读 Region，不读图片，二者互不影响。
 *
 * ============================================================================
 *  插件指令 / Plugin Commands
 * ============================================================================
 *  • Rebuild —— 清掉当前地图碰撞网格后重读图片（改动碰撞图后可用）。
 *  • Reload —— 清掉全部缓存并重建当前地图碰撞。
 *  • Check  —— 输出当前状态（是否命中图片、阻挡象限数）。
 *  • Dump   —— 打印当前地图每格阻挡象限的字符图（核对方向是否如直觉）。
 *
 * ============================================================================
 *  脚本接口 / Script Interface
 * ============================================================================
 *  • WSQ.HCE.reload()     —— 清缓存并重建当前地图碰撞。
 *  • WSQ.HCE.isActive()   —— 返回当前地图是否命中图片碰撞。
 *  • WSQ.HCE.isEnabled()  —— 返回参数「启用」的开关状态。
 *  • WSQ.HCE.debug()      —— 输出诊断信息。
 *  • WSQ.HCE.dumpMap()    —— 输出当前地图挡格象限字符图。
 *
 * ============================================================================
 *  版本 / Version
 * ============================================================================
 *  v1.12 (2026-09-10) 修复：覆写 HalfMove 的移动足印 isMapPassableByHalfRegionAndTag，
 *                      图片激活时查目标格完整2x2（上+下两半行），避免角色身体跨进竖直
 *                      半墙只挡上半、碰撞比图片低半格的偏移。
 *  v1.11 (2026-09-09) 修正注释误导（图片碰撞走 WSQ_CollisionDev「碰撞视角」，
 *                      非「直觉绘制模式」）；新增图片尺寸校验警告；
 *                      dumpMap()/Dump 同时打印图片挡格与 RMMZ 整格通行，便于排查整格被挡。
 *  v1.10 (2026-09-09) 重写：判定改为「坐标 floor 到所在半格子格」，与 WSQ_CollisionDev
 *                       直觉方向一致；移除角色单探针等此前所有多余改动。
 *  v1.00 (2026-09-09) 初版：碰撞图检测、按地图命名匹配、半格/四分之一子格判定。
 * ============================================================================
 */

/*:ja
 * @target MZ
 * @plugindesc [v1.12] マップ - 半マス衝突画像検出（HCE）
 * @author WSQ
 */

(function () {
    'use strict';

    var pluginName = WSQ.HCE.pluginName;

    //=========================================================================
    // 参数读取 / Parameters
    //=========================================================================
    var params = PluginManager.parameters(pluginName);

    function parseColor(str) {
        str = String(str || '').trim();
        if (str.charAt(0) === '#') str = str.slice(1);
        if (str.length === 3) {
            str = str.charAt(0) + str.charAt(0) + str.charAt(1) + str.charAt(1) +
                str.charAt(2) + str.charAt(2);
        }
        if (!/^[0-9a-fA-F]{6}$/.test(str)) return null;
        return {
            r: parseInt(str.slice(0, 2), 16),
            g: parseInt(str.slice(2, 4), 16),
            b: parseInt(str.slice(4, 6), 16)
        };
    }

    var CFG = WSQ.HCE._cfg = {
        enable: String(params['启用'] || 'true') === 'true',
        folder: String(params['图片目录'] || 'img/parallaxes/collision').replace(/\/+$/, ''),
        prefix: String(params['文件名前缀'] || 'map'),
        px: Math.max(2, Math.round(Number(params['每格像素尺寸'] || 10))),
        tolerance: Math.max(0, Math.min(255, Math.round(Number(params['颜色容差'] || 0)))),
        threshold: Math.max(0.01, Math.min(1, Number(params['红色覆盖率阈值'] || 0.5))),
        debug: String(params['调试输出'] || 'false') === 'true'
    };
    var col = parseColor(params['判定颜色'] || '#FF0000') || { r: 255, g: 0, b: 0 };
    CFG.cr = col.r;
    CFG.cg = col.g;
    CFG.cb = col.b;

    if (CFG.px % 2 !== 0) {
        CFG.px += 1;
        if (typeof console !== 'undefined' && console.log) {
            console.log('WSQ_HalfCollisionEx：「每格像素尺寸」必须为偶数，已修正为 ' + CFG.px + '。');
        }
    }

    //=========================================================================
    // 缓存与读取 / Cache & loader
    //=========================================================================
    WSQ.HCE._imageCache = {};   // url -> {data, width, height}
    WSQ.HCE._gridCache = {};    // mapId -> {mask, mapW, mapH, sub, blockedQuarters}

    WSQ.HCE.loadImage = function (folder, name, onLoad, onError) {
        var url = folder + '/' + name + '.png';
        if (CFG.debug && typeof console !== 'undefined' && console.log) {
            console.log('WSQ_HalfCollisionEx：尝试读取碰撞图 ' + url);
        }
        var img = new Image();
        img.onload = function () {
            var canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth || img.width;
            canvas.height = img.naturalHeight || img.height;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            try {
                var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                if (CFG.debug && typeof console !== 'undefined' && console.log) {
                    console.log('WSQ_HalfCollisionEx：碰撞图 ' + url + ' 读取成功（' +
                        canvas.width + 'x' + canvas.height + '）');
                }
                onLoad(imageData.data, canvas.width, canvas.height);
            } catch (e) {
                if (CFG.debug && typeof console !== 'undefined' && console.warn) {
                    console.warn('WSQ_HalfCollisionEx：canvas 读取像素失败（' + e.message +
                        '），改用 MZ Bitmap 途径。');
                }
                WSQ.HCE.loadImageMZ(folder, name, onLoad, onError);
            }
        };
        img.onerror = function () {
            // 该路径下文件不存在：再给 MZ Bitmap 一次机会（兼作二次确认）
            WSQ.HCE.loadImageMZ(folder, name, onLoad, onError);
        };
        img.src = url;
    };

    // 兜底读法：走 RMMZ 引擎的 ImageManager/Bitmap（引擎自身读像素即用此机制）。
    WSQ.HCE.loadImageMZ = function (folder, name, onLoad, onError) {
        if (typeof ImageManager === 'undefined' || !ImageManager.loadBitmap) {
            onError(new Error('MZ ImageManager 不可用'));
            return;
        }
        // MZ 的 loadBitmap 会自带 img/ 前缀，故需去掉开头的 img/
        var folderNoImg = String(folder).replace(/^img[\/\\]/, '');
        var bmp = ImageManager.loadBitmap(folderNoImg, name);
        if (!bmp) {
            onError(new Error('MZ loadBitmap 返回空'));
            return;
        }
        bmp.addLoadListener(function () {
            if (!bmp.isReady() || !bmp.width || !bmp.height) {
                onError(new Error('MZ Bitmap 未就绪'));
                return;
            }
            try {
                var ctx = bmp._context;
                var imageData = ctx ? ctx.getImageData(0, 0, bmp.width, bmp.height) : null;
                if (!imageData) {
                    onError(new Error('MZ Bitmap 无 context'));
                    return;
                }
                if (CFG.debug && typeof console !== 'undefined' && console.log) {
                    console.log('WSQ_HalfCollisionEx：MZ 途径读取成功（' +
                        bmp.width + 'x' + bmp.height + '）');
                }
                onLoad(imageData.data, bmp.width, bmp.height);
            } catch (e) {
                onError(e);
            }
        });
    };

    //=========================================================================
    // 构建碰撞网格 / Build collision grid
    //=========================================================================
    // 每图块 2x2=4 个半格（子格 (sx,sy) 位于图块 (ix,iy) 的 (ix+sx*0.5, iy+sy*0.5)，即
    // 直觉的屏幕方向：sy=0 为上半、sy=1 为下半；sx=0 为左、sx=1 为右）。返回：
    //   { mask, mapW, mapH, sub, blockedQuarters }
    //   mask：Uint8Array，每图块一字节，bit0=左上(sx0,sy0)、bit1=右上(1,0)、
    //         bit2=左下(0,1)、bit3=右下(1,1)。
    //   ⚠ 图片尺寸必须为「地图宽 × 每格像素」×「地图高 × 每格像素」，否则半格会错位。
    WSQ.HCE.buildGrid = function (mapW, mapH, data, imgW, imgH) {
        var sub = 2;
        var halfPx = CFG.px / sub;
        var mask = new Uint8Array(mapW * mapH);
        var tol = CFG.tolerance;
        var tr = CFG.cr, tg = CFG.cg, tb = CFG.cb;
        var thr = CFG.threshold;
        var cellArea = halfPx * halfPx;
        var blockedQuarters = 0;

        if (CFG.debug && (imgW !== mapW * CFG.px || imgH !== mapH * CFG.px)) {
            if (typeof console !== 'undefined' && console.warn) {
                console.warn('WSQ_HalfCollisionEx：碰撞图尺寸 ' + imgW + 'x' + imgH +
                    ' 与期望 ' + (mapW * CFG.px) + 'x' + (mapH * CFG.px) +
                    '（地图 ' + mapW + 'x' + mapH + ' × 每格 ' + CFG.px + 'px）不一致，半格对齐可能错位。');
            }
        }

        for (var ty = 0; ty < mapH; ty++) {
            for (var tx = 0; tx < mapW; tx++) {
                var bits = 0;
                for (var sy = 0; sy < sub; sy++) {
                    var y0 = ty * CFG.px + sy * halfPx;
                    var yStart = Math.floor(y0);
                    var yEnd = Math.floor(y0 + halfPx);
                    for (var sx = 0; sx < sub; sx++) {
                        var x0 = tx * CFG.px + sx * halfPx;
                        var xStart = Math.floor(x0);
                        var xEnd = Math.floor(x0 + halfPx);
                        var red = 0;
                        for (var py = yStart; py < yEnd; py++) {
                            if (py < 0 || py >= imgH) continue;
                            var rowOff = py * imgW;
                            for (var px2 = xStart; px2 < xEnd; px2++) {
                                if (px2 < 0 || px2 >= imgW) continue;
                                var i = (rowOff + px2) * 4;
                                var a = data[i + 3];
                                if (a <= 0) continue;
                                if (Math.abs(data[i] - tr) <= tol &&
                                    Math.abs(data[i + 1] - tg) <= tol &&
                                    Math.abs(data[i + 2] - tb) <= tol) {
                                    red++;
                                }
                            }
                        }
                        var coverage = Math.min(1, red / cellArea);
                        if (coverage >= thr) {
                            bits |= (1 << (sy * 2 + sx));   // 0=左上,1=右上,2=左下,3=右下
                            blockedQuarters++;
                        }
                    }
                }
                mask[ty * mapW + tx] = bits;
            }
        }
        return { mask: mask, mapW: mapW, mapH: mapH, sub: sub, blockedQuarters: blockedQuarters };
    };

    //=========================================================================
    // 挂接 Game_Map / Hook Game_Map
    //=========================================================================
    // HalfMove 不设 Imported.HalfMove 标记，用「方法特征检测」判断是否已加载。
    var hasHalfMoveMethod =
        typeof Game_Map !== 'undefined' &&
        typeof Game_Map.prototype.isPassableByHalfRegionAndTag === 'function';
    if (!hasHalfMoveMethod) {
        if (typeof console !== 'undefined' && console.warn) {
            console.warn('WSQ_HalfCollisionEx：未检测到 HalfMove（缺少 Game_Map.isPassableByHalfRegionAndTag），' +
                '本插件不生效。请确认 HalfMove 已启用且本插件排在它之后。');
        }
        return;
    }

    var _setup = Game_Map.prototype.setup;
    Game_Map.prototype.setup = function (mapId) {
        _setup.apply(this, arguments);
        this._wsqHCESetup(mapId);
    };

    Game_Map.prototype._wsqHCESetup = function (mapId) {
        this._wsqHCEActive = false;
        this._wsqHCEMask = null;
        if (!CFG.enable || mapId <= 0) return;

        if (WSQ.HCE._gridCache[mapId]) {
            this._wsqHCESetFromCache(mapId);
            return;
        }

        var w = this.width(), h = this.height();
        if (!w || !h) return;
        var name = CFG.prefix + mapId;

        WSQ.HCE.loadImage(CFG.folder, name, function (data, imgW, imgH) {
            var built = WSQ.HCE.buildGrid(w, h, data, imgW, imgH);
            WSQ.HCE._gridCache[mapId] = built;
            if (CFG.debug && typeof console !== 'undefined' && console.log) {
                console.log('WSQ_HalfCollisionEx：地图 ' + mapId + ' 碰撞网格构建完成（' +
                    w + 'x' + h + ' 图块），阻挡象限 ' + built.blockedQuarters + ' 个。');
            }
            if ($gameMap && $gameMap.mapId() === mapId) {
                $gameMap._wsqHCESetFromCache(mapId);
            }
        }, function (err) {
            if (typeof console !== 'undefined' && console.warn) {
                console.warn('WSQ_HalfCollisionEx：地图 ' + mapId + ' 碰撞图读取失败（' +
                    (err && err.message ? err.message : '未知原因') + '），退回 HalfMove 区域碰撞。');
            }
        });
    };

    Game_Map.prototype._wsqHCESetFromCache = function (mapId) {
        var c = WSQ.HCE._gridCache[mapId];
        if (!c) return;
        this._wsqHCESub = c.sub;
        this._wsqHCEMapW = c.mapW;
        this._wsqHCEMapH = c.mapH;
        this._wsqHCEMask = c.mask;
        this._wsqHCEBlockedQuarters = c.blockedQuarters;
        this._wsqHCEActive = true;
    };

    // 覆写 HalfMove 的半格/四分之一格碰撞：把坐标 floor 到它所在的 2x2 半格子格
    // （直觉方向，与 WSQ_CollisionDev 的「碰撞视角」一致；其「直觉绘制模式」读 Region
    // 不读本图片）。该子格在碰撞图中被红填满则挡、否则通，画哪挡哪。上半红 => 上半不可通。
    var _origPassable = Game_Map.prototype.isPassableByHalfRegionAndTag;
    Game_Map.prototype.isPassableByHalfRegionAndTag = function (floatX, floatY) {
        if (this._wsqHCEActive && this._wsqHCEMask) {
            var sub = this._wsqHCESub || 2;
            var gx = Math.floor(floatX * sub);
            var gy = Math.floor(floatY * sub);
            if (gx < 0 || gy < 0 || gx >= this._wsqHCEMapW * sub || gy >= this._wsqHCEMapH * sub) {
                return true;   // 越界 -> 可通行（无数据不误挡）
            }
            var tx = Math.floor(gx / sub);
            var ty = Math.floor(gy / sub);
            var sx = gx - tx * sub;   // 0=左, 1=右
            var sy = gy - ty * sub;   // 0=上, 1=下
            var bit = sy * sub + sx;  // 0=左上,1=右上,2=左下,3=右下
            var blocked = (this._wsqHCEMask[ty * this._wsqHCEMapW + tx] & (1 << bit)) !== 0;
            return !blocked;
        }
        return _origPassable.apply(this, arguments);
    };

    //=========================================================================
    // 挂接 Game_CharacterBase / Hook character movement footprint
    //=========================================================================
    // HalfMove 原本的移动足印只查「目标格上半」的左右两个相邻半格（X 对，同一 Y），
    // 不查下半行，导致角色身体跨进竖直半墙时不被挡、碰撞比图片低了半格（脚会踩到
    // 墙的中心才停）。图片激活时改为查「目标格完整2x2足印」（上+下两个半行共4点），
    // 让角色全身都被校验，块就停在墙顶、与图片/检测层一致。非图片地图退回原行为。
    if (typeof Game_CharacterBase !== 'undefined' &&
        typeof Game_CharacterBase.prototype.isMapPassableByHalfRegionAndTag === 'function') {
        var _charOrigPassable = Game_CharacterBase.prototype.isMapPassableByHalfRegionAndTag;
        Game_CharacterBase.prototype.isMapPassableByHalfRegionAndTag = function (x, y, d) {
            if ($gameMap && $gameMap._wsqHCEActive) {
                var tu = Game_Map.tileUnit;
                var targetX = $gameMap.roundHalfXWithDirection(x, d);
                var targetY = $gameMap.roundHalfYWithDirection(y, d);
                if (!$gameMap.isPassableByHalfRegionAndTag(targetX, targetY)) return false;
                if (!$gameMap.isPassableByHalfRegionAndTag(targetX + tu, targetY)) return false;
                if (!$gameMap.isPassableByHalfRegionAndTag(targetX, targetY + tu)) return false;
                if (!$gameMap.isPassableByHalfRegionAndTag(targetX + tu, targetY + tu)) return false;
                return true;
            }
            return _charOrigPassable.apply(this, arguments);
        };
    }

    //=========================================================================
    // 插件指令 / Plugin Commands
    //=========================================================================
    PluginManager.registerCommand(pluginName, 'Rebuild', function () {
        var mapId = $gameMap ? $gameMap.mapId() : 0;
        if (mapId > 0) {
            delete WSQ.HCE._gridCache[mapId];
            $gameMap._wsqHCESetup(mapId);
        }
    });

    PluginManager.registerCommand(pluginName, 'Reload', function () {
        WSQ.HCE._gridCache = {};
        var mapId = $gameMap ? $gameMap.mapId() : 0;
        if (mapId > 0) {
            $gameMap._wsqHCESetup(mapId);
        }
    });

    PluginManager.registerCommand(pluginName, 'Check', function () {
        WSQ.HCE.debug();
    });

    PluginManager.registerCommand(pluginName, 'Dump', function () {
        WSQ.HCE.dumpMap();
    });

    //=========================================================================
    // 脚本接口 / Script Interface
    //=========================================================================
    WSQ.HCE.isEnabled = function () {
        return CFG.enable;
    };

    WSQ.HCE.isActive = function () {
        return !!( $gameMap && $gameMap._wsqHCEActive );
    };

    // 打印当前地图每格「阻挡象限」的字符图（每半格一个字符），并叠加 RMMZ 瓦片整格
    // 可通行性，用于排查「图片只挡上一半、但游戏把整格挡死」这类问题。
    //   '#'=图片红色被挡，'.'=图片可通。
    //   RMMZ 行：'S'=该格是被 RMMZ 瓦片判为整格不可通（图片无法放开，整格必挡）；
    //            '.'=该格 RMMZ 可通（是否被挡只看图片）。
    // 上半涂红且 RMMZ 也 'S' 时，说明整格被 RMMZ 挡死（编辑器中把该格换成可通行的地格即可）。
    WSQ.HCE.dumpMap = function () {
        var gm = $gameMap;
        if (!gm || !gm._wsqHCEMask) {
            if (typeof console !== 'undefined' && console.log) {
                console.log('WSQ_HalfCollisionEx：当前地图(' + (gm ? gm.mapId() : '?') +
                    ')无图片碰撞网格，无内容可打印。');
            }
            return '';
        }
        var sub = gm._wsqHCESub || 2;
        var w = gm._wsqHCEMapW, h = gm._wsqHCEMapH, mask = gm._wsqHCEMask;
        var out = [];
        out.push('WSQ_HalfCollisionEx 地图 ' + gm.mapId() +
            ' 阻挡象限图（每格2行：#=图片挡, .=图片可通）：');
        for (var gy = 0; gy < sub * h; gy++) {
            var rowText = '';
            for (var gx = 0; gx < sub * w; gx++) {
                var tx = Math.floor(gx / sub), ty = Math.floor(gy / sub);
                var sx = gx - tx * sub, sy = gy - ty * sub;
                var bit = sy * sub + sx;
                rowText += (mask[ty * w + tx] & (1 << bit)) ? '#' : '.';
            }
            out.push(('y' + gy + '|') + rowText);
        }
        // RMMZ 瓦片整格可通行性（每格1字符）
        out.push('RMMZ瓦片整格通行（S=整格被RMMZ挡死, .=可通）：');
        var rText = '';
        for (var ty2 = 0; ty2 < h; ty2++) {
            for (var tx2 = 0; tx2 < w; tx2++) {
                var rPass = true;
                try { rPass = gm.isPassable(tx2, ty2, 2); } catch (e) { rPass = true; }
                rText += rPass ? '.' : 'S';
            }
            out.push(('r' + ty2 + '|') + rText);
            rText = '';
        }
        out.push('说明：某格图片只挡上半、但 RMMZ 行对应 ' + 'S' +
            ' 时，整格被 RMMZ 瓦片挡死（图片不会放开它）。请在编辑器中把该格换成可通行地格。');
        if (typeof console !== 'undefined' && console.log) console.log(out.join('\n'));
        return out.join('\n');
    };

    WSQ.HCE.reload = function () {
        WSQ.HCE._gridCache = {};
        var mapId = $gameMap ? $gameMap.mapId() : 0;
        if (mapId > 0) {
            $gameMap._wsqHCESetup(mapId);
        }
    };

    WSQ.HCE.debug = function () {
        var line = 'WSQ_HalfCollisionEx 状态：' +
            '启用=' + CFG.enable +
            '，图片目录=' + CFG.folder +
            '，前缀=' + CFG.prefix +
            '，每格像素=' + CFG.px +
            '，颜色=#' + [CFG.cr, CFG.cg, CFG.cb].map(function (v) {
                return ('0' + v.toString(16)).slice(-2);
            }).join('').toUpperCase() +
            '，容差=' + CFG.tolerance +
            '，覆盖率阈值=' + CFG.threshold +
            '，调试=' + CFG.debug;
        if ($gameMap) {
            line += '\n  当前地图=' + $gameMap.mapId() +
                '，命中图片=' + $gameMap._wsqHCEActive;
            if ($gameMap._wsqHCEActive) {
                line += '，图块=' + $gameMap._wsqHCEMapW + 'x' + $gameMap._wsqHCEMapH +
                    '，阻挡象限=' + $gameMap._wsqHCEBlockedQuarters;
            }
        }
        if (typeof console !== 'undefined' && console.log) console.log(line);
        return line;
    };

})();
