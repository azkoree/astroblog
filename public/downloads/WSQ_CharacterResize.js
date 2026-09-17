//=============================================================================
// GF Plugins (Extension by WSQ)
// WSQ_CharacterResize.js
//=============================================================================
// 行走图自动放大：按 16x16（或任意小尺寸）画好的行走图，直接丢进
// img/characters 即可，插件在运行时把它放大 N 倍（默认 3 倍，16->48 正好一格）
// 后再交给引擎，放大用最近邻，像素块是硬的，不需要先在外部软件里放大再导入。
//
// 只改「位图尺寸」，不碰精灵的 scale。RMMZ 的帧尺寸是从位图现算的
// （Sprite_Character.patternWidth = bitmap.width / 3，$ 单角色图；不是 $ 的
// 整张图则是 width / 12），所以位图放大之后，帧尺寸、帧坐标、头顶图标位置、
// 碰撞/影子等一切依赖位图尺寸的东西都会自动跟着变，引擎和别的插件都不用改；
// scale 也保持原样，留给别的插件用（Hendrix 的单行图左右翻转就靠写 scale.x）。
//
// 标记写在文件名里，插在开头的 !/$ 之后：^名.png、$^名.png、!$^名.png。
// 不能写成 ^$名：引擎判断 !/$ 用的是 /^[!$]+/（rmmz_managers.js 的
// isObjectCharacter / isBigCharacter），Hendrix_Animation_Solution 判断大图用的是
// 先去掉 ! 再 startsWith("$")，^ 放到最前会让这两处判定失效，帧布局会整块错位。
//
// 加载链：同时挂 ImageManager.loadBitmap 与 Hendrix_Animation_Solution 的
// PermanentImageCache.load。后者在开启「Enable Preload」时会绕过 loadBitmap
// 直接 Bitmap.load，是本项目行走图的实际入口（预载目录含 img/characters）。
// 两条链里「原始位图」都仍是引擎缓存里的那个对象，本插件只是额外返回一张
// 放大后的位图，所以加载失败的重试报错（ImageManager.isReady / throwLoadError）
// 照常工作。
//
// 详见末尾 @help。
//=============================================================================

var Imported = Imported || {};
Imported.WSQ_CharacterResize = true;

var WSQ = WSQ || {};
WSQ.CRS = WSQ.CRS || {};
WSQ.CRS.version = 1.00;
WSQ.CRS.pluginName = document.currentScript.src.match(/([^\/]+)\.js/)[1];

/*:
 * @target MZ
 * @plugindesc [v1.00]        地图 - 行走图自动放大（只放小尺寸原图，运行时最近邻放大 N 倍）
 * @author WSQ
 * @url
 *
 * @param Enable
 * @text 启用
 * @type boolean
 * @desc 总开关。关闭时完全不介入图片加载，行走图按原尺寸显示。
 * @default true
 *
 * @param Scale
 * @text 放大倍率
 * @type number
 * @min 1
 * @max 8
 * @desc 放大倍数（整数）。16x16 的图 3 倍正好是 48x48 一格。填 1 表示不放大（与关掉总开关等效）。
 * @default 3
 *
 * @param Mode
 * @text 生效方式
 * @type select
 * @option 仅标记的放大
 * @value onlyMarked
 * @option 除标记外全部放大
 * @value exceptMarked
 * @desc 仅标记的放大：只有文件名带标记的才放大（推荐）。除标记外全部放大：默认全部放大，带标记的除外。
 * @default onlyMarked
 *
 * @param Marker
 * @text 标记字符
 * @type string
 * @desc 用于识别的单个字符，默认 ^。写在文件名的开头符号（!、$）之后，如 $^主角.png。
 * @default ^
 *
 * @param Folder
 * @text 图片目录
 * @type string
 * @desc 只对该目录下的图片生效，默认 img/characters。一般不用改。
 * @default img/characters
 *
 * @param MaxSize
 * @text 原图边长上限
 * @type number
 * @min 0
 * @desc 原图宽或高超过此像素数的图不放大，按原样使用（避免整图放大后过大）。0 表示不限制。
 * @default 512
 *
 * @param Debug
 * @text 调试输出
 * @type boolean
 * @desc 在控制台输出每张图的放大/跳过结果。排查问题时开启，平时关闭。
 * @default false
 *
 * @command Debug
 * @text 输出状态
 * @desc 在控制台输出当前配置与本次运行的处理统计。
 *
 * @help
 * ============================================================================
 *  介绍 / Introduction
 * ============================================================================
 *  用 16x16 之类的「小尺寸单位」画行走图，直接放进 img/characters，由插件在
 *  运行时把整张位图放大 N 倍后交给引擎。放大用最近邻（硬度像素块），因此和你
 *  先在外部软件里放大好再导入的效果一致，但省掉了来回缩放的重复劳动：改完
 *  原图直接开游戏就能看到效果。
 *
 *  为什么能做到：RMMZ 的行走图帧尺寸不是固定的，而是每次都从位图尺寸现算
 *  （$ 单角色图 = 宽/3、高/4；非 $ 的整张图 = 宽/12、高/8）。所以把位图本身
 *  放大之后，帧尺寸、帧坐标、头顶图标位置等都会自动跟着变。本插件为此只做一
 *  件事：在图片加载的地方，把命名符合规则的行走图换成放大后的位图。
 *
 *  例：一张 16x16 的 $ 单角色图，原文件 48x64；3 倍后变成 144x192，帧尺寸
 *      48x48，正好一格。
 *
 * ============================================================================
 *  标记规则 / Filename Marker
 * ============================================================================
 *  标记要插在文件名的「开头符号」之后（! 和 $ 这两个引擎符号之后、正式名字之前）：
 *
 *    ^name.png        没有 !/$ 的普通整张图
 *    $^name.png       单角色大图（文件名的 $ 之后加标记）
 *    !$^name.png      物体类单角色图（$ 之后加标记）
 *
 *  ⚠ 不要写成 ^$name.png。^ 放到最前面会让引擎和 Hendrix 的行走图判定
 *    （/^[!$]+/ 与 startsWith("$")）看不到 $，帧布局会整块错位。
 *
 *  标记只是文件名的一部分，不需要在事件里做任何额外设置：事件图像仍然照常
 *  选 `$^name` 这张图即可。插件不修改文件名、也不会把标记去掉。
 *
 *  关于部署时的「排除未使用文件」：数据库/事件里填的就是带标记的文件名，
 *  和磁盘上的文件名一致，所以这类图片会被正常识别为「使用中」，不会被删。
 *
 * ============================================================================
 *  参数说明 / Parameters
 * ============================================================================
 *  • 启用：总开关，关闭时本插件完全不介入加载。
 *  • 放大倍率：整数 2~8，默认 3（16x16 -> 48x48）。必须是整数，否则帧尺寸会
 *      出现小数，画面会糊。
 *  • 生效方式：
 *      - 仅标记的放大（默认）：只放大带标记的图，其它行走图（包括现成的
 *        48x48 素材和大尺寸 8dir 素材）一律按原样使用。
 *      - 除标记外全部放大：默认全部放大，带标记的除外（把不想放大的图标上）。
 *  • 标记字符：默认 ^，可改成别的单字符。改的时候注意别用字母数字，也不要
 *      用 ! 和 $（这两个是引擎的符号）。
 *  • 图片目录：默认 img/characters。改到别的目录（如图块）请自行确认后果，
 *      非行走图的图片放大后不一定符合引擎预期。
 *  • 原图边长上限：原图宽或高超过这个像素数的图不放大、按原样使用，避免整图
 *      放大后超过显卡的纹理上限（保守按 4096 算）。默认 512。某些大尺寸素材
 *      （如 8dir 的 768x1152）本来就该保持原样，这条是兜底保护。
 *
 * ============================================================================
 *  前置需求 / Requirements
 * ============================================================================
 *  只依赖 RMMZ 本体，无插件依赖，也没有 GF 层级要求（本插件不属于 GF 系列）。
 *
 *  建议排在 Hendrix_Animation_Solution 之后加载：该插件会把
 *  PermanentImageCache 挂到 window 上，且它的「Enable Preload」会把行走图
 *  的加载全部改道到 PermanentImageCache.load。排在后面可以直接钩到它；
 *  排在前面也能工作（插件会在 Scene_Boot 开始时再补一次挂钩），但顺序建议
 *  还是放在它下面。
 *
 * ============================================================================
 *  兼容性 / Compatibility
 * ============================================================================
 *  • 只替换「返回给调用方的位图对象」，原始位图仍然是引擎缓存里的那个，所以
 *    ImageManager.isReady / 加载失败重试、PermanentImageCache 的预载进度统计
 *    都不受影响。
 *  • 不动 sprite.scale，因此与写 scale 的插件（Hendrix 单行图翻转、各种缩放
 *    类效果）不冲突。
 *  • 帧布局插件（Hendrix_Animation_Solution 的 _fN 帧数、8dir）都是从位图尺寸
 *    现算的，放大后自动一致，无需额外适配。
 *  • 与 TDDP_PixelPerfect 配合良好：本项目已开启像素完美模式（全局 _smooth
 *    = false）。即使关掉它，本插件也会强制自己放大的位图用最近邻采样，但游戏
 *    整体的线性缩放仍可能让画面发糊，与本插件无关。
 *  • 与 WSQ_HalfCollisionEx 无冲突：它读的是自己文件夹里的碰撞图，不读行走图。
 *  • ⚠ 编辑器不受影响：在编辑器里选行走图、看地图预览，看到的仍是 16x16 的
 *    原尺寸（编辑器不认识插件）。只有运行中的游戏里是放大后的效果。
 *  • ⚠ 每次地图切换引擎会 ImageManager.clear() 清空图片缓存，行走图会在切图时
 *    重新加载并重新放大一次。开销很小（一张 48x64 的图放大到 144x192 是一次
 *    画布拷贝），但如果一块地图用到很多张标记图，切图时会有一点加载时间。
 *
 * ============================================================================
 *  备注 / Notetag
 * ============================================================================
 *  本插件不使用任何 notetag，全部行为由文件名标记 + 插件参数决定。
 *
 * ============================================================================
 *  插件指令 / Plugin Commands
 * ============================================================================
 *  • 输出状态：在控制台打印当前配置与本次运行的处理统计（检查了多少张、放大
 *    了多少张、因超限跳过多少张）。用于确认标记有没有被正确识别。
 *
 * ============================================================================
 *  脚本接口 / Script Interface
 * ============================================================================
 *  • WSQ.CRS.isMarked(name)   —— 判断某文件名是否带标记，返回 true/false。
 *  • WSQ.CRS.stats()          —— 返回本次运行的处理统计对象。
 *  • WSQ.CRS.isEnabled()      —— 当前是否启用（总开关 + 倍率 > 1）。
 *  • WSQ.CRS.debug()          —— 输出配置与统计。
 *
 * ============================================================================
 *  版本 / Version
 * ============================================================================
 *  v1.00 (2026-09-17) 初版：文件名标记（插在 !/$ 之后）、最近邻整数倍放大、
 *                      仅标记/除标记两种生效方式、原图边长上限保护；
 *                      同时挂 ImageManager.loadBitmap 与 PermanentImageCache.load。
 * ============================================================================
 */

/*:ja
 * @target MZ
 * @plugindesc [v1.00] マップ - キャラクター画像の自動拡大（小さい原図を実行時に最近傍で拡大）
 * @author WSQ
 */

(function () {
    'use strict';

    var pluginName = WSQ.CRS.pluginName;
    var params = PluginManager.parameters(pluginName);

    function log() {
        if (CFG.debug && typeof console !== 'undefined' && console.log) {
            console.log.apply(console, arguments);
        }
    }

    function warn() {
        if (typeof console !== 'undefined' && console.warn) {
            var a = Array.prototype.slice.call(arguments);
            a.unshift('WSQ_CharacterResize：');
            console.warn.apply(console, a);
        }
    }

    function bool(v, def) {
        if (v === undefined || v === null || v === '') return def;
        return String(v) === 'true';
    }

    function num(v, def) {
        var n = Number(v);
        return isFinite(n) ? n : def;
    }

    function clampInt(v, min, max, def) {
        var n = Math.round(num(v, def));
        if (n < min) n = min;
        if (n > max) n = max;
        return n;
    }

    function escapeRegExp(s) {
        return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    // "img/characters/" -> "img/characters"，便于和参数比较
    function normalizeFolder(v) {
        return String(v || '')
            .replace(/\\/g, '/')
            .replace(/^\/+/, '')
            .replace(/\/+$/, '')
            .toLowerCase();
    }

    //=========================================================================
    // 参数读取 / Parameters
    //=========================================================================
    var CFG = WSQ.CRS._cfg = {
        enable: bool(params['Enable'], true),
        scale: clampInt(params['Scale'], 1, 8, 3),
        except: String(params['Mode'] || 'onlyMarked') === 'exceptMarked',
        marker: (function () {
            var m = String(params['Marker']);
            return (m && m !== 'undefined' && m !== 'null') ? m.charAt(0) : '^';
        })(),
        folder: normalizeFolder(params['Folder'] || 'img/characters'),
        maxSize: clampInt(params['MaxSize'], 0, 99999, 512),
        debug: bool(params['Debug'], false)
    };

    // 标记必须紧跟在开头的 !/$ 之后，如 ^名、$^名、!$^名
    var MARK_RE = new RegExp('^[!$]*' + escapeRegExp(CFG.marker));

    if (CFG.marker === '!' || CFG.marker === '$') {
        warn('标记字符不能是 ! 或 $（引擎用它们区分图片类型），已按原字符处理，建议改成 ^ 之类。');
    }
    if (!CFG.enable || CFG.scale <= 1) {
        log('未启用（启用=' + CFG.enable + '，倍率=' + CFG.scale + '），不介入图片加载。');
    }

    //=========================================================================
    // 标记判定 / Marker
    //=========================================================================
    function baseNameOf(name) {
        return String(name === undefined || name === null ? '' : name)
            .split('/').pop()
            .replace(/\.png$/i, '');
    }

    // 文件名是否带标记。只看文件名的开头符号之后那一位，名字中间出现标记字符
    // 不算（避免误伤本来就含该字符的旧素材）。
    WSQ.CRS.isMarked = function (name) {
        var base = baseNameOf(name);
        return !!base && MARK_RE.test(base);
    };

    function folderMatches(folder) {
        return normalizeFolder(folder) === CFG.folder;
    }

    function isActive() {
        return !!CFG.enable && CFG.scale > 1;
    }

    function shouldResize(name) {
        if (!isActive()) return false;
        var marked = WSQ.CRS.isMarked(name);
        return CFG.except ? !marked : marked;
    }

    //=========================================================================
    // 放大 / Resize
    //=========================================================================
    var STATS = WSQ.CRS._stats = { checked: 0, resized: 0, skippedSize: 0, failed: 0 };

    // 原始 Bitmap -> 放大后的 Bitmap。用 WeakMap 是为了跟着原始位图的生命周期走：
    // 引擎清缓存（切图时 ImageManager.clear）后原图变成垃圾，这里的映射和放大图
    // 也一起被回收，不会残留、也不会拿到已经失效的旧放大图。
    var resizedCache = new WeakMap();

    function makePlaceholder() {
        var bmp = new Bitmap(1, 1);
        // 置成 loading：Bitmap.isReady() 对 "none" 也返回 true，不置的话别的插件
        // 可能在内容填进去之前就把这张图当成已就绪。
        bmp._loadingState = 'loading';
        return bmp;
    }

    // 把自建的 canvas 装进目标位图。这里不调用 Bitmap.resize()：canvas 尺寸变了
    // 之后还要额外让 baseTexture 跟着更新才生效，不如按引擎 _createCanvas 的做法
    // 直接连 BaseTexture 一起重建，结果确定。
    function installCanvas(dst, canvas, context) {
        if (typeof dst._createBaseTexture === 'function') {
            if (dst._baseTexture) {
                dst._baseTexture.destroy();
                dst._baseTexture = null;
            }
            dst._canvas = canvas;
            dst._context = context;
            dst._createBaseTexture(canvas);
            return true;
        }
        return false;
    }

    // 尺寸保护命中时（n = 1）不做画布拷贝：直接借用原图的 Image/Canvas 建一张
    // 自己的纹理，像素只有一份。原图本身不会被渲染（拿到它的人都被换成了这张），
    // 所以显存不会翻倍；原图即使之后被引擎清缓存销毁，也不影响这里（Image 元素
    // 不会被 destroy 清掉，纹理也是各自独立的）。
    function delegateToRaw(dst, raw) {
        var source = raw._image || raw._canvas;
        if (!source) return false;
        if (dst._baseTexture) {
            dst._baseTexture.destroy();
            dst._baseTexture = null;
        }
        dst._image = raw._image || null;
        dst._canvas = raw._canvas || null;
        dst._context = raw._context || null;
        dst._createBaseTexture(source);
        dst.smooth = false;
        if (raw._url && !dst._url) dst._url = raw._url;
        return true;
    }

    // 把原图按 n 倍画进 dst；n = 1 时建的是 1:1 副本（尺寸保护命中时用）
    function drawInto(dst, raw, w, h, n) {
        var cw = Math.max(1, w * n);
        var ch = Math.max(1, h * n);

        var canvas = document.createElement('canvas');
        canvas.width = cw;
        canvas.height = ch;
        var context = canvas.getContext('2d');
        // 最近邻：Bitmap.smooth 管的是 GPU 纹理采样，这里管的是 canvas 2D 的
        // drawImage，两者是两回事，放大时必须显式关掉（canvas 尺寸被赋值后
        // context 状态会重置，所以这一行必须在设完尺寸之后）。
        context.imageSmoothingEnabled = false;

        // 与 Bitmap.blt 取源的方式一致
        var source = raw._canvas || raw._image;
        if (!source) throw new Error('原图没有可用的 canvas/image');

        context.drawImage(source, 0, 0, w, h, 0, 0, cw, ch);

        if (!installCanvas(dst, canvas, context)) {
            // 兜底：走引擎公开的 resize + blt
            dst.resize(cw, ch);
            dst.context.imageSmoothingEnabled = false;
            dst.blt(raw, 0, 0, w, h, 0, 0, cw, ch);
        }
        dst.smooth = false;
        if (raw._url && !dst._url) dst._url = raw._url;
    }

    function fill(dst, raw, name) {
        var w = raw.width;
        var h = raw.height;
        if (!w || !h) return;   // 原图没内容，保持 loading，交给引擎的报错流程

        var n = CFG.scale;
        if (CFG.maxSize > 0 && (w > CFG.maxSize || h > CFG.maxSize)) {
            n = 1;
            STATS.skippedSize++;
            log('跳过放大 ' + name + '：原图 ' + w + 'x' + h +
                ' 超过「原图边长上限」' + CFG.maxSize + '，按原样使用。');
        }

        try {
            // 尺寸保护命中：直接借用原图像素，不做任何拷贝
            if (n === 1 && delegateToRaw(dst, raw)) {
                dst._loadingState = 'loaded';
                log('跳过放大 ' + name + '：原图 ' + w + 'x' + h +
                    ' 超过「原图边长上限」' + CFG.maxSize + '，按原样使用。');
                return;
            }
            drawInto(dst, raw, w, h, n);
            if (n > 1) STATS.resized++;
            dst._loadingState = 'loaded';
            if (n > 1) {
                log('放大 ' + name + '：' + w + 'x' + h + ' -> ' + (w * n) + 'x' + (h * n) +
                    '（' + n + ' 倍；帧尺寸由引擎按位图现算）');
            }
        } catch (e) {
            STATS.failed++;
            warn('放大 ' + name + ' 失败（' + (e && e.message ? e.message : e) + '），该图按原尺寸显示。');
            try {
                drawInto(dst, raw, w, h, 1);
                dst._loadingState = 'loaded';
            } catch (e2) {
                dst._loadingState = 'error';
            }
        }
    }

    // 需要放大的行走图：把原图换成一张放大后的位图返回给调用方。
    // 原图仍然是引擎缓存里的那个对象，所以引擎的就绪判定与报错重试不受影响。
    WSQ.CRS._wrap = function (raw, name) {
        if (!raw || typeof raw.addLoadListener !== 'function') return raw;
        if (raw === ImageManager._emptyBitmap) return raw;
        if (raw.__wsqCRS) return raw;                 // 已经是本插件的产物（两条加载链撞车时）
        if (typeof raw.isError === 'function' && raw.isError()) return raw;

        var cached = resizedCache.get(raw);
        if (cached) return cached;

        var dst = makePlaceholder();
        dst.__wsqCRS = true;
        resizedCache.set(raw, dst);
        raw.addLoadListener(function () {
            fill(dst, raw, baseNameOf(name));
        });
        return dst;
    };

    //=========================================================================
    // 挂接加载链 / Hooks
    //=========================================================================
    // 1) ImageManager.loadBitmap：引擎自带的行走图加载入口
    //    （本项目的 Hendrix 开启预载时会把行走图改道到 PermanentImageCache，
    //      所以这一条在那种情况下不会被走到，但仍然要挂，覆盖没开预载的情形。）
    var _loadBitmap = ImageManager.loadBitmap;
    ImageManager.loadBitmap = function (folder, filename) {
        var result = _loadBitmap.call(this, folder, filename);
        if (!filename || !folderMatches(folder)) return result;
        STATS.checked++;
        if (!shouldResize(filename)) return result;
        return WSQ.CRS._wrap(result, filename);
    };

    // 2) PermanentImageCache.load：Hendrix_Animation_Solution 的永久缓存加载器。
    //    开启「Enable Preload」时行走图全部走这里（预载目录含 img/characters），
    //    且它是直接 Bitmap.load(url)，不经过 loadBitmap。
    function hookPermanentCache() {
        var PC = window.PermanentImageCache;
        if (!PC || typeof PC.load !== 'function' || PC.__wsqCRS) return !!PC;
        var _pcLoad = PC.load;
        PC.load = function (folder, filename) {
            var result = _pcLoad.apply(this, arguments);
            if (!filename || !folderMatches(folder)) return result;
            STATS.checked++;
            if (!shouldResize(filename)) return result;
            return WSQ.CRS._wrap(result, filename);
        };
        PC.__wsqCRS = true;
        log('已挂接 PermanentImageCache.load。');
        return true;
    }

    if (!hookPermanentCache()) {
        // 本插件排在 Hendrix_Animation_Solution 前面时，此刻它还没把
        // PermanentImageCache 挂到 window 上，等开局再补挂一次。
        if (typeof Scene_Boot !== 'undefined' && Scene_Boot.prototype.start) {
            var _bootStart = Scene_Boot.prototype.start;
            Scene_Boot.prototype.start = function () {
                hookPermanentCache();
                _bootStart.apply(this, arguments);
            };
        }
    }

    //=========================================================================
    // 插件指令 / Plugin Commands
    //=========================================================================
    PluginManager.registerCommand(pluginName, 'Debug', function () {
        WSQ.CRS.debug();
    });

    //=========================================================================
    // 脚本接口 / Script Interface
    //=========================================================================
    WSQ.CRS.isEnabled = function () {
        return isActive();
    };

    WSQ.CRS.stats = function () {
        return {
            checked: STATS.checked,
            resized: STATS.resized,
            skippedSize: STATS.skippedSize,
            failed: STATS.failed
        };
    };

    WSQ.CRS.debug = function () {
        var line = 'WSQ_CharacterResize 状态：' +
            '启用=' + CFG.enable +
            '，倍率=' + CFG.scale +
            '，生效方式=' + (CFG.except ? '除标记外全部放大' : '仅标记的放大') +
            '，标记=' + CFG.marker +
            '，目录=' + CFG.folder +
            '，原图边长上限=' + (CFG.maxSize > 0 ? CFG.maxSize : '不限制') +
            '，调试=' + CFG.debug +
            '\n  本轮检查 ' + STATS.checked + ' 张，放大 ' + STATS.resized + ' 张' +
            '，超限跳过 ' + STATS.skippedSize + ' 张，失败 ' + STATS.failed + ' 张' +
            '\n  标记写法：^名.png、$^名.png、!$^名.png（标记插在 !/$ 之后，不要写成 ^$名）' +
            '\n  例：' + CFG.folder + '/$' + CFG.marker + '主角_walk_f4.png';
        if (typeof console !== 'undefined' && console.log) console.log(line);
        return line;
    };

})();
