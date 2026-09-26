// ============================================================================
//  WSQ_GainLossPopup.js
//  「得失物品提示」—— RMXP（RGSS1）脚本移植版
//  原脚本出处：www.66RPG.com（本地化 / 移植：WSQ）
//  目标平台：RPG Maker MZ
//  版本：v1.00
// ============================================================================
/*:
 * @target MZ
 * @plugindesc v1.00 在增减金钱 / 物品 / 武器 / 防具 / EXP / 等级后，
 * 弹出居中的半透明提示窗口（RMXP 同名脚本移植版）。
 * @author WSQ
 * @help
 * ============================================================================
 *  WSQ_GainLossPopup — 得失物品提示
 * ============================================================================
 *
 * 【功能】
 * 复刻自 RMXP（RGSS1）的同名脚本，接管以下事件指令：
 *   125 增减金钱      126 增减物品
 *   127 增减武器      128 增减防具
 *   315 增减 EXP      316 增减等级（含升级 / 学会技能提示）
 *
 * 【与原 RMXP 版的差异】
 * 1) 窗口位置从「写死坐标」改为「运行时自适应居中」。
 *    RMXP 原版：(654 - 窗口宽) / 2，其中 654 是当时写死的屏幕宽度；
 *    纵向则用 170 / (435 - 高) / 2 两套写死的数值。
 *    MZ 版：(Graphics.boxWidth - 窗口宽) / 2，分辨率变化后依然居中。
 *    纵向提供「居中 / 按比例 / 固定坐标」三种模式。
 * 2) MZ 无法在事件指令里做同步等待（Graphics.update 不由解释器驱动），
 *    改用 setWaitMode 机制：事件流仍会等提示播完才继续，行为与原版一致。
 * 3) 图标由「文件名」改为「索引」（iconIndex + drawIcon）；
 *    音效名换成 MZ 的命名体系（原版的 006-System06 等文件在 MZ 中不存在）。
 * 4) 等级 / EXP 指令默认「接管」原生升级消息（强制 params[5] 为不显示），
 *    避免出现「系统消息 + 提示窗口」两份重复提示。
 *
 * 【使用】
 * 装上即可，无需任何脚本调用。
 * 若只想对部分场合关闭提示：在「禁用开关」里填一个开关 ID（≥1），
 * 该开关为 ON 时对应的提示不再显示（0 = 不启用，与 RMXP 原版行为一致）。
 *
 * 【注意】
 * 与原版相同：如果在「显示文本」之后立刻增减物品，提示窗会叠在对话框上，
 * 建议对话结束后先「等待 3 帧」再增减物品。
 *
 * 【兼容性】
 * - 覆写 Game_Interpreter 的 125/126/127/128/315/316 六个指令。
 *   若其他插件也改动了这几个指令，加载顺序会影响最终效果。
 * - 使用 Graphics.boxWidth / boxHeight 计算居中，可自适应任何分辨率。
 * ============================================================================
 *
 * @param ── 窗口定位 ──
 * @desc 窗口位置相关设置
 * @default
 *
 * @param PositionMode
 * @text 纵向定位方式
 * @desc center：纵向居中（自动适配分辨率，推荐）
 * ratio ：按剩余高度的比例定位，由「比例」参数决定
 * fixed ：使用固定 Y 坐标，由「固定 Y」参数决定
 * @type select
 * @option 纵向居中
 * @value center
 * @option 按比例
 * @value ratio
 * @option 固定坐标
 * @value fixed
 * @default center
 *
 * @param RatioY
 * @text 比例（按比例模式）
 * @desc 0 = 顶部，0.5 = 纵向居中，1 = 底部。仅在「按比例」模式下生效。
 * @type number
 * @decimals 2
 * @min 0
 * @max 1
 * @default 0.35
 *
 * @param FixedY
 * @text 固定 Y（固定坐标模式）
 * @desc 窗口顶部的 Y 坐标。仅在「固定坐标」模式下生效。原版为 170。
 * @type number
 * @min 0
 * @default 170
 *
 * @param OffsetX
 * @text 水平偏移修正
 * @desc 在居中结果上额外增加的 X 偏移，正数右移，负数左移。
 * @type number
 * @default 0
 *
 * @param OffsetY
 * @text 垂直偏移修正
 * @desc 在定位结果上额外增加的 Y 偏移，正数下移，负数上移。
 * @type number
 * @default 0
 *
 * @param ── 窗口外观 ──
 * @desc 窗口大小与透明度
 * @default
 *
 * @param BackOpacity
 * @text 窗口底板不透明度
 * @desc 0-255。对应 RMXP 的 window.opacity，原版为 160。
 * @type number
 * @min 0
 * @max 255
 * @default 160
 *
 * @param ContentsOpacity
 * @text 内容不透明度
 * @desc 0-255。文字与图标的不透明度，255 为完全不透明。原版为 255。
 * @type number
 * @min 0
 * @max 255
 * @default 255
 *
 * @param TitleSystemColor
 * @text 标题使用系统色
 * @desc 第一行标题使用 MZ 的系统用语配色（与窗口标题风格一致）；关闭则用普通文字色。
 * @type boolean
 * @on 使用
 * @off 不使用
 * @default true
 *
 * @param WindowWidthGold
 * @text 金钱窗宽度
 * @desc 像素。原版为 180。
 * @type number
 * @min 120
 * @default 180
 *
 * @param WindowWidthItem
 * @text 物品窗宽度
 * @desc 像素。物品 / 武器 / 防具三个窗口共用。原版为 300。
 * @type number
 * @min 160
 * @default 300
 *
 * @param WindowWidthLevelUp
 * @text 升级窗宽度
 * @desc 像素。原版为 262。
 * @type number
 * @min 160
 * @default 262
 *
 * @param WindowHeight
 * @text 窗口基础高度
 * @desc 像素。金钱与物品窗的高度（需容纳两行，设置过小会被自动修正）。原版为 100。
 * @type number
 * @min 60
 * @default 108
 *
 * @param ── 时间轴 ──
 * @desc 停留与淡出时长（60 帧 = 1 秒）
 * @default
 *
 * @param HoldFrames
 * @text 停留帧数
 * @desc 完全不透明的停留时间。原版为 30。
 * @type number
 * @min 0
 * @default 30
 *
 * @param FadeFrames
 * @text 淡出帧数
 * @desc 淡出所需帧数。原版为 10。
 * @type number
 * @min 1
 * @default 10
 *
 * @param LevelUpDelay
 * @text 升级窗出现延迟
 * @desc 播放升级音效后延迟多少帧再显示窗口（原版为 10）。0 = 立即显示。
 * @type number
 * @min 0
 * @default 10
 *
 * @param ── 显示内容 ──
 * @desc 文本、数值与角色名处理
 * @default
 *
 * @param ShowSign
 * @text 数值前显示正负号
 * @desc 开启后数值显示为 +100 / -100；原版只显示绝对值。
 * @type boolean
 * @on 显示
 * @off 不显示
 * @default false
 *
 * @param SkipZero
 * @text 数值为 0 时不提示
 * @desc 增减量为 0 时跳过提示窗口。
 * @type boolean
 * @on 跳过
 * @off 仍然提示
 * @default true
 *
 * @param CurrencyUnit
 * @text 货币单位
 * @desc 留空则使用数据库「用语」中设置的货币单位。
 * @default
 *
 * @param ShortNameSeparator
 * @text 角色名截断符号
 * @desc 升级提示只显示该符号之前的部分（原版用「·」截断）。留空则不截断。
 * @default ·
 *
 * @param ShowLearnSkillMessage
 * @text 学会技能时弹出消息
 * @desc 升级过程中学会技能时，在提示窗结束后额外弹出一条消息（对应原版的 message_text 处理）。
 * @type boolean
 * @on 弹出
 * @off 不弹出
 * @default true
 *
 * @param TextGainGold
 * @text 文本：获得金钱
 * @default 获得金钱：
 *
 * @param TextLoseGold
 * @text 文本：失去金钱
 * @default 失去金钱：
 *
 * @param TextGainItem
 * @text 文本：获得物品
 * @default 获得物品：
 *
 * @param TextLoseItem
 * @text 文本：失去物品
 * @default 失去物品：
 *
 * @param TextGainWeapon
 * @text 文本：获得武器
 * @default 获得武器：
 *
 * @param TextLoseWeapon
 * @text 文本：失去武器
 * @default 失去武器：
 *
 * @param TextGainArmor
 * @text 文本：获得防具
 * @default 获得防具：
 *
 * @param TextLoseArmor
 * @text 文本：失去防具
 * @default 失去防具：
 *
 * @param TextPartyLevelUp
 * @text 文本：全员升级
 * @default 全体同伴 LEVEL UP!
 *
 * @param TextLevelUp
 * @text 文本：升级
 * @default LEVEL UP!
 *
 * @param TextLearnSkill
 * @text 文本：学会技能
 * @desc %1 = 角色名，%2 = 技能名。
 * @default %1 学会了新特技「%2」。
 *
 * @param ── 禁用开关 ──
 * @desc 填入开关 ID（≥1）；该开关为 ON 时对应提示不显示。0 = 不启用。
 * @default
 *
 * @param SwitchGold
 * @text 禁用：金钱提示
 * @type switch
 * @default 0
 *
 * @param SwitchItem
 * @text 禁用：物品提示
 * @type switch
 * @default 0
 *
 * @param SwitchWeapon
 * @text 禁用：武器提示
 * @type switch
 * @default 0
 *
 * @param SwitchArmor
 * @text 禁用：防具提示
 * @type switch
 * @default 0
 *
 * @param SwitchLevelUp
 * @text 禁用：升级提示
 * @type switch
 * @default 0
 *
 * @param ── 音效 ──
 * @desc 播放的音效（目录：audio/se）。音频留空 = 不播放。
 * @default
 *
 * @param SeGain
 * @text 获得音效
 * @type struct<WSQ_Audio>
 * @default {"name":"Item3","volume":"80","pitch":"100"}
 *
 * @param SeLose
 * @text 失去音效
 * @type struct<WSQ_Audio>
 * @default {"name":"Cancel2","volume":"80","pitch":"100"}
 *
 * @param SeLevelUp
 * @text 升级音效
 * @type struct<WSQ_Audio>
 * @default {"name":"Recovery","volume":"80","pitch":"100"}
 *
 * @param SeLearnSkill
 * @text 学会技能音效
 * @type struct<WSQ_Audio>
 * @default {"name":"Bell3","volume":"80","pitch":"100"}
 */
/*~struct~WSQ_Audio:
 * @param name
 * @text 音频文件
 * @desc 留空 = 不播放。目录：audio/se
 * @type file
 * @dir audio/se
 * @default
 *
 * @param volume
 * @text 音量
 * @type number
 * @min 0
 * @max 100
 * @default 80
 *
 * @param pitch
 * @text 音高
 * @type number
 * @min 50
 * @max 150
 * @default 100
 */

(() => {
    "use strict";

    const PLUGIN_NAME = "WSQ_GainLossPopup";
    const WAIT_MODE = "WSQ_GainLossPopup";
    const LINE_HEIGHT = 36;
    const RAW = PluginManager.parameters(PLUGIN_NAME);

    // ========================================================================
    //  参数读取
    // ========================================================================
    const num = (value, def) => {
        const n = Number(value);
        return Number.isFinite(n) ? n : def;
    };

    const str = (value, def) => {
        const s = value === undefined || value === null ? "" : String(value);
        return s === "" ? def : s;
    };

    const bool = (value, def) => {
        if (value === undefined || value === null || value === "") return def;
        return String(value) === "true";
    };

    /** struct 参数：兼容「JSON 字符串」与「已被解析为对象」两种形态 */
    const parseObject = raw => {
        if (raw && typeof raw === "object") return raw;
        try {
            return JSON.parse(String(raw || "{}")) || {};
        } catch (e) {
            return {};
        }
    };

    /** 把 file 类型参数规整成 AudioManager 需要的裸文件名 */
    const audioName = value => {
        let name = String(value === undefined || value === null ? "" : value).trim();
        if (!name) return "";
        name = name.replace(/\\/g, "/");
        const slash = name.lastIndexOf("/");
        if (slash >= 0) name = name.slice(slash + 1);
        return name.replace(/\.[A-Za-z0-9]+$/, "");
    };

    const parseAudio = (raw, defName) => {
        const o = parseObject(raw);
        return {
            name: audioName(o.name === undefined ? defName : o.name),
            volume: num(o.volume, 80),
            pitch: num(o.pitch, 100)
        };
    };

    const Config = {
        positionMode: str(RAW.PositionMode, "center"),
        ratioY: num(RAW.RatioY, 0.35),
        fixedY: num(RAW.FixedY, 170),
        offsetX: num(RAW.OffsetX, 0),
        offsetY: num(RAW.OffsetY, 0),
        backOpacity: num(RAW.BackOpacity, 160),
        contentsOpacity: num(RAW.ContentsOpacity, 255),
        titleSystemColor: bool(RAW.TitleSystemColor, true),
        goldWidth: num(RAW.WindowWidthGold, 180),
        itemWidth: num(RAW.WindowWidthItem, 300),
        levelUpWidth: num(RAW.WindowWidthLevelUp, 262),
        windowHeight: num(RAW.WindowHeight, 108),
        holdFrames: Math.max(0, num(RAW.HoldFrames, 30)),
        fadeFrames: Math.max(1, num(RAW.FadeFrames, 10)),
        levelUpDelay: Math.max(0, num(RAW.LevelUpDelay, 10)),
        showSign: bool(RAW.ShowSign, false),
        skipZero: bool(RAW.SkipZero, true),
        currencyUnit: String(RAW.CurrencyUnit === undefined ? "" : RAW.CurrencyUnit),
        shortNameSeparator: String(
            RAW.ShortNameSeparator === undefined ? "·" : RAW.ShortNameSeparator
        ),
        showLearnSkillMessage: bool(RAW.ShowLearnSkillMessage, true),
        switchGold: num(RAW.SwitchGold, 0),
        switchItem: num(RAW.SwitchItem, 0),
        switchWeapon: num(RAW.SwitchWeapon, 0),
        switchArmor: num(RAW.SwitchArmor, 0),
        switchLevelUp: num(RAW.SwitchLevelUp, 0)
    };

    const Text = {
        gainGold: str(RAW.TextGainGold, "获得金钱："),
        loseGold: str(RAW.TextLoseGold, "失去金钱："),
        gainItem: str(RAW.TextGainItem, "获得物品："),
        loseItem: str(RAW.TextLoseItem, "失去物品："),
        gainWeapon: str(RAW.TextGainWeapon, "获得武器："),
        loseWeapon: str(RAW.TextLoseWeapon, "失去武器："),
        gainArmor: str(RAW.TextGainArmor, "获得防具："),
        loseArmor: str(RAW.TextLoseArmor, "失去防具："),
        partyLevelUp: str(RAW.TextPartyLevelUp, "全体同伴 LEVEL UP!"),
        levelUp: str(RAW.TextLevelUp, "LEVEL UP!"),
        learnSkill: str(RAW.TextLearnSkill, "%1 学会了新特技「%2」。")
    };

    const Se = {
        gain: parseAudio(RAW.SeGain, "Item3"),
        lose: parseAudio(RAW.SeLose, "Cancel2"),
        levelUp: parseAudio(RAW.SeLevelUp, "Recovery"),
        learnSkill: parseAudio(RAW.SeLearnSkill, "Bell3")
    };

    // ========================================================================
    //  工具
    // ========================================================================
    const playSe = setting => {
        if (!setting || !setting.name) return;
        try {
            AudioManager.playSe({
                name: setting.name,
                volume: setting.volume,
                pitch: setting.pitch,
                pan: 0
            });
        } catch (e) {
            console.warn(PLUGIN_NAME + "：音效播放失败 -> " + setting.name);
        }
    };

    /** 一行内容的窗口高度（MZ 行高固定 36） */
    const heightForLines = lines =>
        lines * LINE_HEIGHT + $gameSystem.windowPadding() * 2;

    const twoLineHeight = () =>
        Math.max(Config.windowHeight, heightForLines(2));

    /**
     * 计算窗口矩形。
     * 水平方向：(Graphics.boxWidth - 窗口宽) / 2 —— 这就是原版写死的居中公式，
     * 只是把常量换成了运行时的实际宽度，分辨率变了也依然居中。
     */
    const popupRect = (width, height) => {
        const w = Math.round(width);
        const h = Math.round(height);
        const x = Math.round((Graphics.boxWidth - w) / 2) + Config.offsetX;

        let baseY;
        switch (Config.positionMode) {
            case "fixed":
                baseY = Config.fixedY;
                break;
            case "ratio":
                baseY = Math.round((Graphics.boxHeight - h) * Config.ratioY);
                break;
            default:
                baseY = Math.round((Graphics.boxHeight - h) / 2);
                break;
        }
        return new Rectangle(x, baseY + Config.offsetY, w, h);
    };

    const signPrefix = value => (Config.showSign ? (value >= 0 ? "+" : "-") : "");

    const actorShortName = actor => {
        const sep = Config.shortNameSeparator;
        const name = String(actor.name);
        if (!sep) return name;
        return name.split(sep)[0];
    };

    // ========================================================================
    //  提示窗口
    // ========================================================================
    function Window_GainLossPopup() {
        this.initialize.apply(this, arguments);
    }
    Window_GainLossPopup.prototype = Object.create(Window_Base.prototype);
    Window_GainLossPopup.prototype.constructor = Window_GainLossPopup;

    Window_GainLossPopup.prototype.initialize = function(rect) {
        Window_Base.prototype.initialize.call(this, rect);
        this._data = null;
        this.openness = 255;
        this.backOpacity = Config.backOpacity;
        this.contentsOpacity = Config.contentsOpacity;
    };

    Window_GainLossPopup.prototype.setData = function(data) {
        this._data = data;
        this.refresh();
    };

    Window_GainLossPopup.prototype.refresh = function() {
        this.contents.clear();
        const data = this._data;
        if (!data) return;
        switch (data.type) {
            case "gold":
                this.drawGoldContent(data);
                break;
            case "item":
                this.drawItemContent(data);
                break;
            case "levelup":
                this.drawLevelUpContent(data);
                break;
        }
    };

    Window_GainLossPopup.prototype.drawTitle = function(text, width) {
        if (Config.titleSystemColor) {
            this.changeTextColor(ColorManager.systemColor());
        } else {
            this.resetTextColor();
        }
        this.drawText(text, 0, 0, width, "center");
        this.resetTextColor();
    };

    Window_GainLossPopup.prototype.drawGoldContent = function(data) {
        const width = this.contentsWidth();
        const unit = Config.currencyUnit || TextManager.currencyUnit;
        this.drawTitle(data.title, width);
        this.drawText(data.valueText + unit, 0, this.lineHeight(), width, "center");
    };

    Window_GainLossPopup.prototype.drawItemContent = function(data) {
        const width = this.contentsWidth();
        const y = this.lineHeight();
        this.drawTitle(data.title, width);

        let x = 0;
        if (data.iconIndex >= 0) {
            const iconY = y + (this.lineHeight() - ImageManager.iconHeight) / 2;
            this.drawIcon(data.iconIndex, x, iconY);
            x += ImageManager.iconWidth + 4;
        }

        const countText = "×" + data.count;
        const countWidth = this.textWidth(countText);
        const nameWidth = Math.max(0, width - x - countWidth - 8);
        this.resetTextColor();
        this.drawText(this.ellipsisText(data.name, nameWidth), x, y, nameWidth, "left");
        this.drawText(countText, 0, y, width, "right");
    };

    Window_GainLossPopup.prototype.drawLevelUpContent = function(data) {
        const width = this.contentsWidth();
        if (data.allMembers) {
            this.drawTitle(Text.partyLevelUp, width);
            return;
        }
        const rightWidth = this.textWidth(Text.levelUp);
        const nameWidth = Math.max(0, width - rightWidth - 8);
        this.resetTextColor();
        data.entries.forEach((name, index) => {
            const y = index * this.lineHeight();
            this.drawText(name, 0, y, nameWidth, "left");
            this.drawText(Text.levelUp, 0, y, width, "right");
        });
    };

    /** 超宽文本用省略号收尾，避免压到右侧的数量文本 */
    Window_GainLossPopup.prototype.ellipsisText = function(text, width) {
        const source = String(text);
        if (width <= 0 || this.textWidth(source) <= width) return source;
        let s = source;
        while (s.length > 0 && this.textWidth(s + "…") > width) {
            s = s.slice(0, -1);
        }
        return s + "…";
    };

    // ========================================================================
    //  弹窗调度（阻塞期间由事件解释器逐帧驱动）
    // ========================================================================
    const Popup = {
        _current: null,
        _queue: [],
        _readyMessage: null,
        _frame: -1,

        isBusy() {
            return this._current !== null || this._queue.length > 0;
        },

        push(win, message, delay, sound) {
            this._queue.push({
                win: win,
                message: message || null,
                delay: Math.max(0, delay || 0),
                sound: sound || null
            });
        },

        takeReadyMessage() {
            const message = this._readyMessage;
            this._readyMessage = null;
            return message;
        },

        /**
         * 每帧推进一次。
         * 返回 "busy"（继续等待）/ "message"（等待结束后需弹消息）/ "done"。
         * 用 Graphics.frameCount 去重，防止并行事件让同一帧推进两次。
         */
        update() {
            if (this._frame === Graphics.frameCount) {
                return this.isBusy() ? "busy" : "done";
            }
            this._frame = Graphics.frameCount;

            if (!this._current) {
                if (this._queue.length > 0) {
                    this._startNext();
                    return "busy";
                }
                return "done";
            }

            const cur = this._current;
            const win = cur.win;
            win.update();

            if (cur.phase === "delay") {
                cur.count--;
                if (cur.count <= 0) {
                    cur.phase = "hold";
                    cur.count = Config.holdFrames;
                    win.visible = true;
                }
                return "busy";
            }

            if (cur.phase === "hold") {
                cur.count--;
                if (cur.count <= 0) {
                    cur.phase = "fade";
                    cur.count = Config.fadeFrames;
                    cur.elapsed = 0;
                    cur.baseBack = win.backOpacity;
                    cur.baseContents = win.contentsOpacity;
                }
                return "busy";
            }

            // fade
            cur.elapsed++;
            const t = Math.min(1, cur.elapsed / cur.count);
            win.backOpacity = cur.baseBack * (1 - t);
            win.contentsOpacity = cur.baseContents * (1 - t);
            if (t < 1) return "busy";

            const message = cur.message;
            const sound = cur.sound;
            this._disposeCurrent();
            if (message && message.length > 0 && this._queue.length === 0) {
                if (sound) playSe(sound);
                this._readyMessage = message;
                return "message";
            }
            return this.isBusy() ? "busy" : "done";
        },

        /** 场景切换等场合强制清场 */
        clear() {
            this._disposeCurrent();
            while (this._queue.length > 0) {
                this._destroyWindow(this._queue.shift().win);
            }
            this._readyMessage = null;
        },

        _startNext() {
            const item = this._queue.shift();
            const win = item.win;
            this._current = {
                win: win,
                phase: item.delay > 0 ? "delay" : "hold",
                count: item.delay > 0 ? item.delay : Config.holdFrames,
                elapsed: 0,
                baseBack: win.backOpacity,
                baseContents: win.contentsOpacity,
                message: item.message,
                sound: item.sound
            };
            if (item.delay > 0) win.visible = false;
            this._attachWindow(win);
        },

        _attachWindow(win) {
            const scene = SceneManager._scene;
            if (scene && scene._windowLayer) {
                scene._windowLayer.addChild(win);
            } else if (scene) {
                scene.addChild(win);
            }
        },

        _disposeCurrent() {
            const cur = this._current;
            this._current = null;
            if (cur) this._destroyWindow(cur.win);
        },

        _destroyWindow(win) {
            if (!win) return;
            if (win.parent) win.parent.removeChild(win);
            win.destroy();
        }
    };

    // ========================================================================
    //  事件解释器：弹出提示
    // ========================================================================
    const startPopup = (interpreter, win, message, delay, sound) => {
        Popup.push(win, message, delay, sound);
        interpreter.setWaitMode(WAIT_MODE);
    };

    Game_Interpreter.prototype.wsqPopupDisabled = function(switchId) {
        if (!switchId || switchId <= 0) return false;
        return $gameSwitches.value(switchId) === true;
    };

    Game_Interpreter.prototype.wsqPopupGold = function(value) {
        if (this.wsqPopupDisabled(Config.switchGold)) return;
        if (Config.skipZero && value === 0) return;

        const win = new Window_GainLossPopup(
            popupRect(Config.goldWidth, twoLineHeight())
        );
        win.setData({
            type: "gold",
            title: value >= 0 ? Text.gainGold : Text.loseGold,
            valueText: signPrefix(value) + Math.abs(value)
        });
        playSe(value >= 0 ? Se.gain : Se.lose);
        startPopup(this, win, null, 0);
    };

    Game_Interpreter.prototype.wsqPopupItem = function(item, value, kind) {
        const switchId =
            kind === "weapon"
                ? Config.switchWeapon
                : kind === "armor"
                ? Config.switchArmor
                : Config.switchItem;
        if (this.wsqPopupDisabled(switchId)) return;
        if (Config.skipZero && value === 0) return;
        if (!item) return;

        const titles =
            kind === "weapon"
                ? [Text.gainWeapon, Text.loseWeapon]
                : kind === "armor"
                ? [Text.gainArmor, Text.loseArmor]
                : [Text.gainItem, Text.loseItem];

        const win = new Window_GainLossPopup(
            popupRect(Config.itemWidth, twoLineHeight())
        );
        win.setData({
            type: "item",
            title: value >= 0 ? titles[0] : titles[1],
            iconIndex: item.iconIndex,
            name: item.name,
            count: Math.abs(value)
        });
        playSe(value >= 0 ? Se.gain : Se.lose);
        startPopup(this, win, null, 0);
    };

    Game_Interpreter.prototype.wsqPopupLevelUp = function(entries, learnedSkills) {
        // 只有「队伍人数 > 1 且所有人都升级」才显示全员升级（原版在单人队伍时也会误判）
        const memberCount = $gameParty.members().length;
        const allMembers = memberCount > 1 && entries.length >= memberCount;
        const rows = allMembers ? 1 : Math.max(1, entries.length);
        const height = Math.max(Config.windowHeight, heightForLines(rows));

        const win = new Window_GainLossPopup(
            popupRect(Config.levelUpWidth, height)
        );
        win.setData({
            type: "levelup",
            allMembers: allMembers,
            entries: entries
        });
        playSe(Se.levelUp);

        const message =
            Config.showLearnSkillMessage && learnedSkills.length > 0
                ? learnedSkills
                : null;
        // 学会技能的音效在提示窗结束后、消息弹出前播放（对应原版的 ME）
        const learnSound = message ? Se.learnSkill : null;
        startPopup(this, win, message, Config.levelUpDelay, learnSound);
    };

    /**
     * EXP / 等级变化的共用流程：
     * - 提示启用时：强制关掉原生升级消息（接管），自行记录升级者与学会的技能
     * - 提示禁用时：完全保留原生行为（params[5] 原样传入）
     */
    Game_Interpreter.prototype.wsqApplyLevelChange = function(
        actorType,
        actorId,
        apply,
        nativeShow
    ) {
        const suppressed = !this.wsqPopupDisabled(Config.switchLevelUp);
        const showNative = suppressed ? false : nativeShow;
        const entries = [];
        const learnedSkills = [];

        this.iterateActorEx(actorType, actorId, actor => {
            const lastLevel = actor.level;
            const lastSkills = suppressed ? actor.skills() : null;
            apply(actor, showNative);
            if (suppressed && actor.level > lastLevel) {
                const name = actorShortName(actor);
                entries.push(name);
                actor.findNewSkills(lastSkills).forEach(skill => {
                    learnedSkills.push(
                        Text.learnSkill
                            .replace(/%1/g, name)
                            .replace(/%2/g, skill.name)
                    );
                });
            }
        });

        if (suppressed && entries.length > 0) {
            this.wsqPopupLevelUp(entries, learnedSkills);
        }
    };

    // ------------------------------------------------------------------------
    //  指令覆写
    // ------------------------------------------------------------------------
    Game_Interpreter.prototype.command125 = function(params) {
        const value = this.operateValue(params[0], params[1], params[2]);
        $gameParty.gainGold(value);
        this.wsqPopupGold(value);
        return true;
    };

    Game_Interpreter.prototype.command126 = function(params) {
        const value = this.operateValue(params[1], params[2], params[3]);
        $gameParty.gainItem($dataItems[params[0]], value);
        this.wsqPopupItem($dataItems[params[0]], value, "item");
        return true;
    };

    Game_Interpreter.prototype.command127 = function(params) {
        const value = this.operateValue(params[1], params[2], params[3]);
        $gameParty.gainItem($dataWeapons[params[0]], value, params[4]);
        this.wsqPopupItem($dataWeapons[params[0]], value, "weapon");
        return true;
    };

    Game_Interpreter.prototype.command128 = function(params) {
        const value = this.operateValue(params[1], params[2], params[3]);
        $gameParty.gainItem($dataArmors[params[0]], value, params[4]);
        this.wsqPopupItem($dataArmors[params[0]], value, "armor");
        return true;
    };

    Game_Interpreter.prototype.command315 = function(params) {
        const value = this.operateValue(params[2], params[3], params[4]);
        this.wsqApplyLevelChange(
            params[0],
            params[1],
            (actor, showLevelUp) =>
                actor.changeExp(actor.currentExp() + value, showLevelUp),
            params[5]
        );
        return true;
    };

    Game_Interpreter.prototype.command316 = function(params) {
        const value = this.operateValue(params[2], params[3], params[4]);
        this.wsqApplyLevelChange(
            params[0],
            params[1],
            (actor, showLevelUp) =>
                actor.changeLevel(actor.level + value, showLevelUp),
            params[5]
        );
        return true;
    };

    // ========================================================================
    //  等待模式接管
    // ========================================================================
    const _Game_Interpreter_updateWaitMode =
        Game_Interpreter.prototype.updateWaitMode;

    Game_Interpreter.prototype.updateWaitMode = function() {
        if (this._waitMode !== WAIT_MODE) {
            return _Game_Interpreter_updateWaitMode.call(this);
        }

        const state = Popup.update();
        if (state === "busy") return true;

        this._waitMode = "";
        if (state === "message") {
            const messages = Popup.takeReadyMessage();
            if (messages && messages.length > 0) {
                messages.forEach(text => $gameMessage.add(text));
                this.setWaitMode("message");
                return true;
            }
        }
        return false;
    };

    // ========================================================================
    //  场景切换时清场，避免窗口残留
    // ========================================================================
    const _Scene_Base_terminate = Scene_Base.prototype.terminate;
    Scene_Base.prototype.terminate = function() {
        _Scene_Base_terminate.call(this);
        Popup.clear();
    };
})();
