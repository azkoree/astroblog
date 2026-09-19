//=============================================================================
// WSQ Plugins (Extension by WSQ)
// WSQ_PixelSnapScale.js
//=============================================================================
// 像素完美「显示比例吸附」：RMMZ 把 816x624 的渲染缓冲按「窗口边长 / 816」的比例
// 拉伸铺满窗口，这个比例几乎总是非整数（rmmz_core.js 的 _updateRealScale），于是
// 一个源像素占到的设备像素数在 k 与 k+1 之间跳，画面里出现「像素块大小不一」。
//
// 本插件把 Graphics._realScale 向下吸附到 1/(像素单位 x 系统缩放) 的整数倍，
// 让「一个像素单位」正好占整数个设备像素，块宽完全一致。
//
// 数学依据：设 S 为一个渲染缓冲像素占用的设备像素数，美术像素在缓冲里占 D 个
// 像素（= 行走图的放大倍率），最近邻采样下一个美术像素覆盖的设备像素数为
// ceil((f+D)*S) - ceil(f*S)。只要 D*S 是整数，该差值就恒等于 D*S，与位置 f 无关。
//
// 只改 _realScale 这一个值，不碰精灵缩放、不改位图、不动渲染顺序；代价是画布
// 不再铺满窗口、四周留黑边（index.html 的 body 是黑底，黑边不显突兀）。
//
// 详见末尾 @help。
//=============================================================================

var Imported = Imported || {};
Imported.WSQ_PixelSnapScale = true;

var WSQ = WSQ || {};
WSQ.PSS = WSQ.PSS || {};
WSQ.PSS.version = 1.01;
WSQ.PSS.pluginName = document.currentScript.src.match(/([^\/]+)\.js/)[1];

/*:
 * @target MZ
 * @plugindesc [v1.01]        系统 - 显示比例吸附到像素单位（消除放大后像素块大小不一）
 * @author WSQ
 * @url
 *
 * @param Enable
 * @text 启用
 * @type boolean
 * @desc 总开关。关闭时完全不介入 Graphics._realScale，画面按引擎原样铺满窗口。
 * @default true
 *
 * @param PixelUnit
 * @text 像素单位
 * @type select
 * @option 1
 * @value 1
 * @option 2
 * @value 2
 * @option 3
 * @value 3
 * @option 4
 * @value 4
 * @option 6
 * @value 6
 * @option 8
 * @value 8
 * @desc 一个「美术像素」在渲染缓冲里占几个像素，应填行走图的放大倍率（如 24 格画好放大 2 倍就填 2，16 格放大 3 倍就填 3）。填 1 表示按整数倍显示，任何倍率都整齐，但画面会明显变小。
 * @default 2
 *
 * @param UseDevicePixelRatio
 * @text 纳入系统缩放
 * @type boolean
 * @desc 开启时按 _realScale x devicePixelRatio 计算，Windows 125%/150% 显示缩放下的屏幕同样整齐。个别环境出现异常时可关掉。
 * @default true
 *
 * @param MaxShrink
 * @text 最大缩小比例
 * @type number
 * @min 0
 * @max 100
 * @decimals 1
 * @desc 吸附后画面最多允许比原来小百分之几（吸附只能向下取整，窗口越小损失越大；常见窗口下最坏约 33%）。超过此值就不吸附、按引擎原样显示，并在控制台提示。默认 40 已覆盖常见窗口，填 100 表示不限制（永远吸附）。
 * @default 40
 *
 * @param Debug
 * @text 调试输出
 * @type boolean
 * @desc 每次窗口尺寸变化时在控制台输出原始比例与吸附结果。排查问题时开启，平时关闭。
 * @default false
 *
 * @param ConfigSymbol
 * @text 设置核心关键字
 * @type string
 * @desc 与 GF 设置核心（GF_2_CoreOfOption）里那一项「布尔值选项」的关键字保持一致，用于把设置界面的勾选框接到本插件开关上。两边要同步改名，留空则用 pixelSnapScale。
 * @default pixelSnapScale
 *
 * @command ShowStatus
 * @text 输出状态
 * @desc 在控制台输出当前显示比例、像素单位，以及一个像素单位占用的设备像素数（整数即像素块完全一致）。
 *
 * @help
 * ============================================================================
 *  介绍 / Introduction
 * ============================================================================
 *  解决「小尺寸行走图放大后像素块大小不一」的问题。
 *
 *  现象：以 24x24 为单位画行走图、最近邻放大 2 倍到 48x48 显示，画面里的像素块
 *  宽一块窄一块；换成 16x16 放大 3 倍，观感就正常 —— 越小的放大倍率越明显。
 *
 *  原因不在「放大」这一步（位图层面的整数倍最近邻放大是数学上精确的），而在最后
 *  一环：引擎把 816x624 的渲染缓冲拉伸到窗口时用的比例几乎总是非整数。以
 *  1920x1080 满屏、系统缩放 100% 为例，这个比例约 1.7308，于是
 *    24 格 x2  ->  一个美术像素占 3.46 个设备像素  ->  实际宽 3、4、3、4 交替
 *    16 格 x3  ->  一个美术像素占 5.19 个设备像素  ->  实际宽 5、5、5、5、6
 *  误差上限固定是 1 个设备像素，而块的宽度是「倍率 x 比例」，倍率越小，同样的
 *  误差占比越大，所以 2 倍比 3 倍难看得多。
 *
 *  本插件把显示比例吸附到一个「刚好能让一个像素单位占整数个设备像素」的值：
 *  比例向下取到 1/(像素单位 x 系统缩放) 的整数倍（上例中 3.46 -> 3，比例
 *  1.7308 -> 1.5），此时每个像素块宽度严格相同。
 *
 * ============================================================================
 *  原理 / How It Works
 * ============================================================================
 *  设 S = 一个渲染缓冲像素占用的设备像素数（= _realScale x devicePixelRatio），
 *  D = 像素单位（一个美术像素在缓冲里占几个像素）。
 *  浏览器对画布用最近邻（image-rendering: pixelated，由 TDDP_PixelPerfect 之类
 *  的插件设置）采样时，第 f 个缓冲像素覆盖的设备像素是
 *      ceil((f + 1) * S) - ceil(f * S)
 *  取连续 D 个缓冲像素组成的一个美术像素：
 *      ceil((f + D) * S) - ceil(f * S)
 *  若 D * S 为整数 K，则上式 = K + ceil(f*S) - ceil(f*S) = K，与 f 无关。
 *  ⇒ 吸附条件即「D * S 为整数」，本插件取 S = floor(raw * D) / D（raw 为引擎
 *  算出的原始比例），D * S = floor(raw * D)，必为整数。
 *
 *  所以不需要把画面缩成整数倍：像素单位 2 时只需比例 1.5（画布 1224x936），
 *  像素单位 3 时只需比例 5/3（画布 1360x1040），屏幕只损失一点边距。
 *
 * ============================================================================
 *  参数说明 / Parameters
 * ============================================================================
 *  • 启用：总开关，关闭时本插件完全不介入。
 *  • 像素单位：填行走图的放大倍率。
 *      - 24x24 为单位、放大 2 倍到 48x48  ->  填 2
 *      - 16x16 为单位、放大 3 倍到 48x48  ->  填 3
 *      - 填 1：按整数倍显示。此时画面上任何内容（图块、UI、文字）都整齐，
 *        代价最大 —— 816x624 在 1080p 上只能 1 倍，画面缩到窗口的一小半。
 *    ⚠ 画面里若混用多种像素单位（角色是 2 个缓冲像素、图块是 3 个缓冲像素），
 *      填 2 只保证 2 个单位的内容整齐，3 个单位的仍会轻微不均；要让所有内容都
 *      整齐，只能填 1，或把所有美术统一到同一个像素单位。
 *    ⚠ 取值建议 1、2、3、4、6、8（都是 816 与 624 的公约数），这样画布的设备
 *      像素宽高也是整数、边缘不会被切掉零点几像素。其它整数照样生效，只是
 *      边缘可能少零点几像素。
 *  • 纳入系统缩放：开启时按 _realScale x devicePixelRatio 计算。
 *  • 最大缩小比例：吸附只能向下取整，窗口越小损失越大（最坏情况接近 1 - k/(k+1)）。
 *      超过此值就不吸附、按引擎原样显示并在控制台提示。填 100 表示永远吸附。
 *  • 调试输出：每次重算比例时在控制台打印原始值与吸附值。
 *  • 设置核心关键字：见下一节「设置核心联动」。填本插件自己改过名才需要动。
 *
 * ============================================================================
 *  设置核心联动 / Options Core
 * ============================================================================
 *  想让玩家在「设置」界面里自己开关本插件，**不需要写任何自定义选项的 JS**：
 *  只要在 GF_2_CoreOfOption 的参数 CategorieSet 里放一项「布尔值选项」，让它的
 *  关键字与上面的「设置核心关键字」一致（默认 pixelSnapScale），本插件会自动接管。
 *
 *  联动原理：本插件在 ConfigManager 上为这个关键字挂了一个取值/赋值口 ——
 *  读出来就是本插件的启用状态，写进去就等于调用 WSQ.PSS.setEnabled()。
 *  而 GF 设置核心的存盘（makeData）、读档（applyData）、默认值（initConfigData）
 *  以及选项窗口改值，全部都是通过 ConfigManager[关键字] 读写的，所以挂上这
 *  一个口子，四件事一次到位。
 *
 *  开关语义：
 *    勾选   -> 吸附显示比例到像素单位的整数倍（画面四周留黑边，像素块宽度一致）
 *    不勾选 -> 完全不介入 _realScale，回到引擎原样铺满窗口的显示方式
 *  切换后画面立即重算，无需重启。
 *
 *  ⚠ 该关键字永远有值（不会是 undefined），所以设置核心里那一项的「默认值」不会
 *    生效 —— 首次运行的默认状态由本插件参数「启用」决定。希望玩家第一次进游戏
 *    时默认关闭，就把参数「启用」改为 false。
 *  ⚠ 关键字必须全局唯一。设置核心里已有的键名（alwaysDash、mapUpdateSpeed、
 *    showFPS ……）不能重复，重名时后一项会覆盖前一项。
 *  ⚠ 这个勾选框只管本插件。TDDP_PixelPerfect 的「像素完美模式」是另一项，两者
 *    职责不同、缺一不可：TDDP 负责关双线性过滤（边缘变硬），本插件负责吸附显示
 *    比例（块宽一致）。只关本插件 = 铺满窗口但像素块大小不一；只关 TDDP =
 *    块宽一致但整体仍被浏览器插值糊掉。
 *
 * ============================================================================
 *  前置需求 / Requirements
 * ============================================================================
 *  只依赖 RMMZ 本体，无插件依赖，也没有 GF 层级要求（本插件不属于 GF 系列）。
 *
 *  建议与 TDDP_PixelPerfect 同时开启，但两者职责不同、缺一不可：
 *    - TDDP_PixelPerfect 负责关掉双线性过滤（canvas 的 image-rendering 设为
 *      pixelated），没有它，画面整体仍会被浏览器插值糊掉；
 *    - 本插件负责把显示比例吸附成「一个像素单位 = 整数个设备像素」，没有它，
 *      即使边缘是硬的，块的宽度仍然一大一小。
 *  两者互不依赖，加载顺序任意。
 *
 * ============================================================================
 *  兼容性 / Compatibility
 * ============================================================================
 *  • 只改 Graphics._realScale 的值，不改方法结构、不动 _canvas 尺寸：
 *    引擎的 _centerElement、pageToCanvasX/Y（鼠标与触屏坐标换算）、
 *    _updateErrorPrinter、Video.resize 都读同一个值，因此全部自动保持一致。
 *  • 窗口尺寸变化、全屏切换、F3/F4 开关拉伸都会走 _updateAllElements ->
 *    _updateRealScale，本插件在同一个入口生效，无需额外处理。
 *  • F4 关闭拉伸时引擎用 _defaultScale（通常为 1），D x 1 必为整数，本来就整齐，
 *    本插件不会改变这条路径的结果。
 *  • 与写 scale 的插件（Hendrix 单行图翻转、各种缩放效果）不冲突。
 *  • 与 CGMZ_Core 等镜像了 _centerElement 的插件不冲突：它们同样读 _realScale。
 *  • ⚠ 副作用：画布不再铺满窗口，四周留黑边（index.html 的 body 是黑底）。
 *    若希望画面更大，把游戏窗口调大即可 —— 比例越大，损失的比例越小。
 *
 * ============================================================================
 *  备注 / Notetag
 * ============================================================================
 *  本插件不使用任何 notetag，全部行为由插件参数决定。
 *
 * ============================================================================
 *  插件指令 / Plugin Commands
 * ============================================================================
 *  • 输出状态：在控制台打印当前比例与吸附结果，用来确认是否生效、是否整齐。
 *
 * ============================================================================
 *  脚本接口 / Script Interface
 * ============================================================================
 *  • WSQ.PSS.info()            返回当前状态对象（原始比例、实际比例、像素单位、
 *                              系统缩放、一个像素单位占用的设备像素数等）。
 *  • WSQ.PSS.unit()            返回当前像素单位。
 *  • WSQ.PSS.setUnit(n)        临时修改像素单位（立即重算并重新居中画布）。
 *  • WSQ.PSS.setEnabled(bool)  临时开关本插件（立即重算）。
 *  • WSQ.PSS.refresh()         强制重算比例并重新居中画布。
 *  • WSQ.PSS.debug()           输出状态。
 *  • WSQ.PSS.optionSymbol      当前与设置核心联动的 ConfigManager 关键字。
 *
 * ============================================================================
 *  版本 / Version
 * ============================================================================
 *  v1.00 (2026-09-18) 初版：把 Graphics._realScale 向下吸附到
 *                      1/(像素单位 x devicePixelRatio) 的整数倍；可选纳入系统
 *                      缩放、最大缩小比例保护、调试输出与状态查询接口。
 *  v1.01 (2026-09-18) 增加与 GF 设置核心（GF_2_CoreOfOption）的联动：在
 *                      ConfigManager 上为指定关键字挂取值/赋值口，设置界面里的
 *                      布尔值选项即可直接开关本插件，存盘/读档/默认值自动同步。
 * ============================================================================
 */

/*:ja
 * @target MZ
 * @plugindesc [v1.00] システム - 表示倍率をピクセル単位にスナップ（拡大後のドット幅の不均一を解消）
 * @author WSQ
 */

(function () {
    'use strict';

    var pluginName = WSQ.PSS.pluginName;
    var params = PluginManager.parameters(pluginName);

    function log() {
        if (CFG.debug && typeof console !== 'undefined' && console.log) {
            console.log.apply(console, arguments);
        }
    }

    function warn() {
        if (typeof console !== 'undefined' && console.warn) {
            var a = Array.prototype.slice.call(arguments);
            a.unshift('WSQ_PixelSnapScale：');
            console.warn.apply(console, a);
        }
    }

    function bool(v, def) {
        if (v === undefined || v === null || v === '') return def;
        return String(v) === 'true';
    }

    function num(v, def) {
        if (v === undefined || v === null || v === '') return def;
        var n = Number(v);
        return isFinite(n) ? n : def;
    }

    //=========================================================================
    // 参数读取 / Parameters
    //=========================================================================
    var CFG = WSQ.PSS._cfg = {
        enable: bool(params['Enable'], true),
        unit: (function () {
            var n = Math.round(num(params['PixelUnit'], 2));
            return n >= 1 ? n : 2;
        })(),
        useDPR: bool(params['UseDevicePixelRatio'], true),
        maxShrink: (function () {
            var n = num(params['MaxShrink'], 40);
            if (n < 0) n = 0;
            if (n > 100) n = 100;
            return n;
        })(),
        debug: bool(params['Debug'], false)
    };

    //=========================================================================
    // 状态 / State
    //=========================================================================
    var STATE = WSQ.PSS._state = {
        raw: 0,             // 引擎算出的原始比例（未吸附）
        real: 0,            // 吸附后实际生效的比例
        unit: CFG.unit,
        dpr: 1,
        applied: false,     // 本次是否真的吸附了（false = 原样保留）
        aligned: false      // 原始比例本来就对齐、无需调整
    };

    if (!CFG.enable) {
        log('未启用，不介入 Graphics._realScale。');
    }

    // 分辨率要等到 Graphics.initialize 之后才知道，所以延迟到第一次 apply 时
    // 检查，并用 warnedUnit 保证只提示一次。
    var warnedUnit = false;

    function checkUnitDivides(g) {
        if (warnedUnit || CFG.unit <= 1) return;
        var w = Math.round(g._width);
        var h = Math.round(g._height);
        if (!(w > 0) || !(h > 0)) return;
        warnedUnit = true;
        if (w % CFG.unit !== 0 || h % CFG.unit !== 0) {
            warn('像素单位 ' + CFG.unit + ' 不能整除分辨率 ' + w + 'x' + h +
                '，画布的设备像素宽高会出现小数、边缘可能少零点几像素；' +
                '建议改成 1、2、3、4、6、8。');
        }
    }

    //=========================================================================
    // 取值 / Accessors
    //=========================================================================
    WSQ.PSS.unit = function () {
        return STATE.unit;
    };

    WSQ.PSS.dpr = function () {
        if (!CFG.useDPR) return 1;
        var d = window.devicePixelRatio;
        return (isFinite(d) && d > 0) ? d : 1;
    };

    //=========================================================================
    // 吸附 / Snap
    //=========================================================================
    // 把 g._realScale 向下吸附到 1/(像素单位 x 系统缩放) 的整数倍。
    // 每次都由引擎的原始值重新计算，不做累加，所以反复调用不会漂移。
    WSQ.PSS.apply = function (g) {
        g = g || Graphics;
        var raw = g._realScale;
        STATE.raw = raw;
        STATE.applied = false;
        STATE.aligned = false;
        STATE.unit = CFG.unit;
        STATE.dpr = WSQ.PSS.dpr();
        STATE.real = raw;

        if (!CFG.enable) return raw;
        if (!(g._width > 0) || !(g._height > 0)) return raw;
        if (!isFinite(raw) || raw <= 0) return raw;

        checkUnitDivides(g);

        var denom = STATE.unit * STATE.dpr;
        // 加一点容差，避免浮点误差把 3.0 算成 2.9999999
        var k = Math.floor(raw * denom + 1e-6);
        if (k < 1) {
            warn('窗口太小（原始比例 ' + round4(raw) + '），无法容纳一个像素单位，' +
                '本次按引擎原样显示。');
            return raw;
        }

        var snapped = k / denom;
        var shrink = 100 * (1 - snapped / raw);
        if (CFG.maxShrink < 100 && shrink > CFG.maxShrink) {
            warn('吸附后画面要缩小 ' + round4(shrink) + '%，超过「最大缩小比例」' +
                CFG.maxShrink + '%，本次按引擎原样显示（像素块会大小不一）。' +
                '把游戏窗口调大能减小这个损失，或调高该参数。');
            return raw;
        }

        if (snapped < raw) {
            // ⚠ 只能向下取整：吸附后比例恒 <= 原始比例，画布永远装得下窗口。
            // 这条不变式由本分支保证，不要改成「哪个更接近原始值就取哪个」。
            g._realScale = snapped;
            STATE.applied = true;
            log('比例吸附：' + round4(raw) + ' -> ' + round4(snapped) +
                '（像素单位 ' + STATE.unit + '，系统缩放 ' + round4(STATE.dpr) +
                '，缩小 ' + round4(shrink) + '%）');
        } else {
            // 原始比例正好是 1/(像素单位 x 系统缩放) 的整数倍，本来就整齐
            STATE.aligned = true;
            log('比例本就对齐：' + round4(raw) + '，无需调整。');
        }
        STATE.real = g._realScale;
        return g._realScale;
    };

    function round4(n) {
        return Math.round(n * 10000) / 10000;
    }

    //=========================================================================
    // Graphics 挂钩 / Hook
    //=========================================================================
    const _Graphics_updateRealScale = Graphics._updateRealScale;
    Graphics._updateRealScale = function () {
        _Graphics_updateRealScale.call(this);
        WSQ.PSS.apply(this);
    };

    WSQ.PSS.refresh = function () {
        if (typeof Graphics._updateAllElements === 'function') {
            Graphics._updateAllElements();
        } else {
            Graphics._updateRealScale();
        }
    };

    WSQ.PSS.setUnit = function (n) {
        var v = Math.round(num(n, NaN));
        if (!isFinite(v) || v < 1) {
            warn('像素单位必须是 >=1 的整数，已忽略。');
            return false;
        }
        CFG.unit = v;
        STATE.unit = v;
        WSQ.PSS.refresh();
        return true;
    };

    WSQ.PSS.setEnabled = function (value) {
        CFG.enable = !!value;
        WSQ.PSS.refresh();
        return CFG.enable;
    };

    //=========================================================================
    // 状态查询 / Status
    //=========================================================================
    WSQ.PSS.info = function () {
        var s = Graphics._realScale;
        var dpr = WSQ.PSS.dpr();
        var deviceScale = s * dpr;
        var unit = CFG.unit;
        return {
            enable: CFG.enable,
            applied: STATE.applied,
            aligned: STATE.aligned,
            unit: unit,
            devicePixelRatio: dpr,
            rawScale: STATE.raw,
            realScale: s,
            deviceScale: deviceScale,
            devicePerUnit: deviceScale * unit,      // 一个像素单位占几个设备像素（整数即完全一致）
            canvasCss: [Graphics._width * s, Graphics._height * s],
            canvasDevice: [Graphics._width * deviceScale, Graphics._height * deviceScale],
            letterboxCss: [
                Graphics._stretchWidth() - Graphics._width * s,
                Graphics._stretchHeight() - Graphics._height * s
            ]
        };
    };

    WSQ.PSS.debug = function () {
        var i = WSQ.PSS.info();
        var perUnit = i.devicePerUnit;
        var whole = Math.abs(perUnit - Math.round(perUnit)) < 1e-6;
        console.log(
            'WSQ_PixelSnapScale 状态\n' +
            '  启用            : ' + i.enable + '\n' +
            '  像素单位        : ' + i.unit + '\n' +
            '  系统缩放        : ' + round4(i.devicePixelRatio) + '\n' +
            '  原始比例        : ' + round4(i.rawScale) + '\n' +
            '  实际比例        : ' + round4(i.realScale) +
            (i.applied ? '（已吸附）' : (i.aligned ? '（本就对齐）' : '（原样保留）')) + '\n' +
            '  画布 CSS 尺寸   : ' + round4(i.canvasCss[0]) + ' x ' + round4(i.canvasCss[1]) + '\n' +
            '  画布设备像素    : ' + round4(i.canvasDevice[0]) + ' x ' + round4(i.canvasDevice[1]) + '\n' +
            '  留边（CSS）     : ' + round4(i.letterboxCss[0]) + ' x ' + round4(i.letterboxCss[1]) + '\n' +
            '  一个像素单位    : ' + round4(perUnit) + ' 个设备像素' +
            (whole
                ? '  ->  整数，像素块宽度完全一致'
                : '  ->  非整数，像素块仍会大小不一')
        );
        return i;
    };

    PluginManager.registerCommand(pluginName, 'ShowStatus', function () {
        WSQ.PSS.debug();
    });

    //=========================================================================
    // 设置核心联动 / Options Core Bridge
    //=========================================================================
    // 在 ConfigManager 上为「设置核心关键字」挂一个取值/赋值口：
    //   get -> 本插件当前的启用状态 CFG.enable
    //   set -> 改 CFG.enable 并立即重算显示比例
    // GF 设置核心（GF_2_CoreOfOption）里同关键字的「布尔值选项」，其改值、存盘
    // （makeData）、读档（applyData）、默认值（initConfigData）全部都是通过
    // ConfigManager[关键字] 读写的，所以挂上这一个口子就全部对上了。
    var OPTION_KEY = String(params['ConfigSymbol'] || '').trim() || 'pixelSnapScale';
    WSQ.PSS.optionSymbol = OPTION_KEY;

    function normalizeBool(value, def) {
        if (typeof value === 'boolean') return value;
        if (typeof value === 'number') return value !== 0;
        if (typeof value === 'string') {
            var s = value.trim().toLowerCase();
            if (s === '' || s === 'false' || s === '0' || s === 'off' || s === 'no') return false;
            if (s === 'true' || s === '1' || s === 'on' || s === 'yes') return true;
        }
        return (value === undefined || value === null) ? def : !!value;
    }

    function applyOptionValue(value) {
        var v = normalizeBool(value, CFG.enable);
        if (v === CFG.enable) return v;
        CFG.enable = v;
        // 启动早期画布可能还没建好，此时不必重算 —— Graphics._updateRealScale
        // 首次执行时会读到最新的 CFG.enable。
        if (Graphics._canvas) WSQ.PSS.refresh();
        log('设置核心联动：' + OPTION_KEY + ' = ' + v);
        return v;
    }

    if (typeof ConfigManager !== 'undefined') {
        var existDesc = Object.getOwnPropertyDescriptor(ConfigManager, OPTION_KEY);
        if (existDesc && typeof existDesc.get === 'function') {
            warn('ConfigManager.' + OPTION_KEY + ' 已被其它插件定义成取值器，' +
                '本次跳过设置核心联动；改「设置核心关键字」参数可换个键名。');
        } else {
            Object.defineProperty(ConfigManager, OPTION_KEY, {
                configurable: true,
                enumerable: true,
                get: function () {
                    return CFG.enable;
                },
                set: function (value) {
                    applyOptionValue(value);
                }
            });
        }
    }
})();
