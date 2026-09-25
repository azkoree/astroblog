//=============================================================================
// GF Plugins Compatible
// WSQ_DevParams.js
//=============================================================================

var Imported = Imported || {};
Imported.WSQ_DevParams = true;

var WSQ = WSQ || {};
WSQ.DevParams = WSQ.DevParams || {};
WSQ.DVP = WSQ.DevParams;
WSQ.DevParams.version = 1.00;
WSQ.DevParams.pluginName = document.currentScript.src.match(/([^\/]+)\.js/)[1];

//=============================================================================
/*:
 * @target MZ
 * @plugindesc [v1.00]        开发工具 - 在 JS 里直接写插件参数（免插件管理器调参）
 * @author WSQ
 *
 * @help
 * ============================================================================
 *  介绍
 * ============================================================================
 * 把「要调的插件参数」用原生 JS 语法写在下面的配置区，保存文件后重启游戏即可
 * 看效果，不必再打开插件管理器逐项点选。
 *
 * 只覆盖你写进配置区的字段，其余全部保持 js/plugins.js 中的原值；
 * 本插件不读写 js/plugins.js，也不改动任何插件源码。
 *
 * ============================================================================
 *  前置需求 / 加载顺序（重要）
 * ============================================================================
 * 1. 本插件必须排在「你要覆盖的插件」之前，所以应尽量放在加载列表靠上的位置。
 *    若想覆盖 GF_0_CoreOfGame 这类最底层插件，请把它放到列表最前面。
 * 2. 只能覆盖「已启用插件」的参数：插件被禁用时其参数根本不会被读取。
 * 3. 参数在插件脚本加载时被一次性解析，因此改完必须重启游戏，不支持热更新。
 * 4. 启动后若某条覆盖没生效，控制台会输出原因（顺序不对 / 插件未启用）。
 *
 * ============================================================================
 *  使用方式
 * ============================================================================
 * 在配置区（WSQ.DevParams.CONFIG）按下述形状书写，一个插件一个键：
 *
 *     插件文件名（不含 .js，大小写不敏感）: {
 *         参数名: 值,
 *         结构体参数名: { 只写你要改的那几个字段 },
 *         结构体列表参数名: { 下标: { 只写你要改的字段 } }
 *     }
 *
 * 参数名必须与插件注解里 param 后的名字完全一致；列表下标从 0 开始。
 *
 * ============================================================================
 *  编码规则（自动处理，无需关心）
 * ============================================================================
 * 原值形态                      你写什么                  自动怎么存
 * ----------------------------------------------------------------------------
 * 普通标量（数字/文本/开关）    408 / '文本' / true       String(值)
 * 结构体                        对象（可只写部分字段）    与旧值合并后序列化
 * 结构体列表                    下标对象（增量修改）      按下标合并
 * 结构体列表                    数组（整份替换）          逐项序列化
 * 代码字段                      源码字符串 或 普通函数    自动补 JSON 编码与 this 绑定
 *
 * 代码字段指 GF 里注解为 @type note 的那些（例如 TextJS / ShowButton /
 * EnableButton / CallHandler）。它们可以直接写普通函数，本插件会转成
 * 「return (函数).apply(this, arguments);」再交给插件，函数内的 this 即为
 * 调用方（按钮所属窗口）。注意：请用 function 写法，不要用箭头函数。
 *
 * ============================================================================
 *  兜底手段
 * ============================================================================
 * WSQ.DevParams.code(值)    强制按「代码字段」编码（自动判别不了时用）
 * WSQ.DevParams.raw(字符串) 原样写入、不做任何编码（已手写好原始串时用）
 *
 * ============================================================================
 *  兼容性
 * ============================================================================
 * 只包装 PluginManager.parameters 一个函数，不对任何插件做别名或覆写。
 * 把 ENABLE 改成 false（或在插件管理器中禁用本插件）即完全恢复原状，
 * 可以安全地长期留在工程里。
 *
 * ============================================================================
 *  脚本接口
 * ============================================================================
 * WSQ.DevParams.effective(插件名) 返回当前生效的参数表（可用于回填编辑器）
 * WSQ.DevParams.dump(插件名)      在控制台打印当前生效的参数表
 */
//=============================================================================

//=============================================================================
// 写作辅助
//=============================================================================

// 把「源码字符串 / 普通函数」统一转成代码字段要的源码文本
WSQ.DevParams.sourceOf = function (value) {
	if (typeof value === 'function') {
		return 'return (' + value.toString() + ').apply(this, arguments);';
	}
	return String(value);
};

// 强制按「代码字段」编码
WSQ.DevParams.code = function (value) {
	return { __wsq: 'code', v: WSQ.DevParams.sourceOf(value) };
};

// 原样写入，不做任何编码
WSQ.DevParams.raw = function (text) {
	return { __wsq: 'raw', v: String(text) };
};

//=============================================================================
// 配置区 —— 平时只改这一块
//=============================================================================

// 上线前改成 false 即可让所有覆盖失效
WSQ.DevParams.ENABLE = true;

WSQ.DevParams.CONFIG = {

	// ==========================================================================
	// 示例：主菜单核心 GF_2_CoreOfMainMenu
	// 下面全部是注释状态，需要哪条就把它的 // 去掉。
	// ==========================================================================
	//
	// 'GF_2_CoreOfMainMenu': {
	//
	//     // ① 普通参数：数字 / 文本 / 开关，照原样写
	//     MainPopDelay: 0,
	//     EndPopDelay: 0,
	//     EndBackOpacity: 160,
	//
	//     // ② 结构体：只写要改的字段，其余自动继承旧值
	//     MapNameSet: {
	//         WindowX: 40,
	//         WindowY: 620,
	//         WindowMoving: { MoveTime: 8 }      // 结构体里嵌套的结构体，同样只写一项
	//     },
	//
	//     // ③ 结构体列表：按下标增量改（下标从 0 开始：0 物品 / 1 技能 / 2 装备 / 3 状态 ...）
	//     CommandButtons: {
	//         3: { TextJS: 'return "状态";' },   // 只改第 4 个按钮的名字
	//         14: { ShowButton: 'return false;' } // 隐藏退出菜单按钮
	//     },
	//
	//     // ④ 结构体列表：整份替换（元素里没写的字段会走插件自身的默认值）
	//     // CommandButtons: [
	//     //     {
	//     //         Note: '--物品--', Symbol: 'item', Bitmap: '',
	//     //         TextJS: 'return TextManager.item;',
	//     //         ShowButton: 'return this.needsCommand("item");',
	//     //         EnableButton: 'return this.areMainCommandsEnabled();',
	//     //         TriggerType: '运行代码',
	//     //         CallHandler: function () { this.commandItem(); },
	//     //         CallCommonEvent: 0, CallSubCommand: 1
	//     //     }
	//     // ],
	//
	//     // ⑤ 结构体：整段替换时用 raw 直接给原始串
	//     // ActorCmdSet: WSQ.DevParams.raw('{"ActorButtonSet":"1","ActorCmdStyle":"2","ActorCmdX":"316","ActorCmdY":"460","ActorCmdNum":"4"}')
	// },

	// ==========================================================================
	// 再加别的插件，照抄上面的写法，一个插件一个键即可，例如：
	// 'GF_2_CoreOfTitle': { ... },
	// 'GF_0_CoreOfGame': { ... },
	// ==========================================================================

};

//=============================================================================
// 内部实现（一般不需要改动）
//=============================================================================

(function () {
	'use strict';

	const DP = WSQ.DevParams;

	// 开关关掉 => 完全不干预参数读取
	if (!DP.ENABLE) {
		DP.effective = function (name) { return PluginManager.parameters(name); };
		DP.dump = function (name) { console.log('[WSQ_DevParams] ' + name, DP.effective(name)); };
		return;
	}

	//-------------------------------------------------------------------------
	// 原值形态判别
	//-------------------------------------------------------------------------

	// GF 把代码类字段（@type note）存成「JSON 字符串的 JSON 字符串」，
	// 原始串形如 "return true;"（首字符是引号）=> 据此识别代码字段。
	function isCodeRaw(raw) {
		return typeof raw === 'string' && /^\s*"/.test(raw);
	}

	// 原始串是 struct 时返回其对象，否则返回 null
	function asObject(raw) {
		if (typeof raw !== 'string') return null;
		const s = raw.trim();
		if (s[0] !== '{') return null;
		try {
			const o = JSON.parse(s);
			return (o && typeof o === 'object' && !Array.isArray(o)) ? o : null;
		} catch (e) {
			return null;
		}
	}

	// 原始串是 struct 列表时返回其数组，否则返回 null
	function asArray(raw) {
		if (typeof raw !== 'string') return null;
		const s = raw.trim();
		if (s[0] !== '[') return null;
		try {
			const a = JSON.parse(s);
			return Array.isArray(a) ? a : null;
		} catch (e) {
			return null;
		}
	}

	function isPlainObject(value) {
		return !!value && typeof value === 'object' && !Array.isArray(value) && !value.__wsq;
	}

	function isIndexMap(value) {
		if (!isPlainObject(value)) return false;
		const keys = Object.keys(value);
		return keys.length > 0 && keys.every(k => /^\d+$/.test(k));
	}

	//-------------------------------------------------------------------------
	// 编码：配置区写的原生值  ->  插件认的原始串
	//-------------------------------------------------------------------------

	function encodeLeaf(originalRaw, value) {
		if (value === undefined || value === null) return '';
		if (typeof value === 'function') return JSON.stringify(DP.sourceOf(value));
		// 原字段本就是代码字段 => 用户写的即为源码，补一层 JSON 编码
		if (isCodeRaw(originalRaw)) return JSON.stringify(String(value));
		return String(value);
	}

	function mergeValue(originalRaw, value) {
		if (value && value.__wsq === 'raw') return value.v;
		if (value && value.__wsq === 'code') return JSON.stringify(value.v);

		// ---- 结构体列表：整份替换 ----
		if (Array.isArray(value)) {
			const tplArr = asArray(originalRaw) || [];
			const tplEl = asObject(tplArr[0]);
			const out = value.map(el => {
				if (el && el.__wsq === 'raw') return el.v;
				if (isPlainObject(el)) return JSON.stringify(mergeStruct(null, el, tplEl));
				return String(el);
			});
			return JSON.stringify(out);
		}

		// ---- 结构体列表：按下标增量改 ----
		const origArr = asArray(originalRaw);
		if (origArr !== null && isIndexMap(value)) {
			const out = origArr.slice();
			// 元素 0 只作为「字段类型参照」，不继承它的值
			const tplEl = asObject(origArr[0]);
			for (const key of Object.keys(value)) {
				const index = Number(key);
				while (out.length <= index) out.push('{}');
				out[index] = JSON.stringify(mergeStruct(asObject(out[index]), value[key], tplEl));
			}
			return JSON.stringify(out);
		}

		// ---- 结构体：字段级增量合并 ----
		if (isPlainObject(value)) {
			return JSON.stringify(mergeStruct(asObject(originalRaw), value));
		}

		// ---- 标量 ----
		return encodeLeaf(originalRaw, value);
	}

	// base：该结构体的原值（可为 null，表示新建）
	// tpl ：字段类型参照（可为 null），仅用于用户新写的字段
	// 返回「字段名 -> 原始串」的新对象
	function mergeStruct(base, value, tpl) {
		const out = {};
		if (base) for (const key in base) out[key] = base[key];
		const ref = base || {};
		const typeRef = tpl || base || {};
		for (const key of Object.keys(value)) {
			const raw = (key in ref) ? ref[key] : ((key in typeRef) ? typeRef[key] : undefined);
			out[key] = mergeValue(raw, value[key]);
		}
		return out;
	}

	//-------------------------------------------------------------------------
	// 覆盖表
	//-------------------------------------------------------------------------

	const lookup = {};
	for (const name of Object.keys(DP.CONFIG || {})) {
		lookup[String(name).toLowerCase()] = DP.CONFIG[name];
	}

	const cache = {};
	const applied = {};
	const warned = {};

	function mergedParameters(key) {
		if (cache[key]) return cache[key];
		const original = PluginManager._parameters[key] || {};
		if (Object.keys(original).length === 0 && !warned[key]) {
			warned[key] = true;
			console.warn('[WSQ_DevParams] plugins.js 中没有「' + key + '」的已保存参数，'
				+ '本次覆盖将按值类型推断编码（代码字段请用 WSQ.DevParams.code 包裹）。');
		}
		const out = {};
		for (const name in original) out[name] = original[name];
		const delta = lookup[key];
		for (const name of Object.keys(delta)) {
			out[name] = mergeValue(original[name], delta[name]);
		}
		cache[key] = out;
		return out;
	}

	//-------------------------------------------------------------------------
	// 拦截 PluginManager.parameters
	//-------------------------------------------------------------------------

	const _PluginManager_parameters = PluginManager.parameters;
	PluginManager.parameters = function (name) {
		const key = String(name || '').toLowerCase();
		if (lookup[key]) {
			applied[key] = true;
			return mergedParameters(key);
		}
		return _PluginManager_parameters.apply(this, arguments);
	};

	//-------------------------------------------------------------------------
	// 诊断：启动时报告没生效的覆盖
	//-------------------------------------------------------------------------

	function reportMissed() {
		const missed = [];
		for (const key of Object.keys(lookup)) {
			if (applied[key]) continue;
			const loaded = (PluginManager._scripts || []).some(s => String(s).toLowerCase() === key);
			missed.push(key + (loaded
				? '（本插件排在它之后，请把本插件移到它前面）'
				: '（未启用，或不在 plugins.js 中）'));
		}
		if (missed.length > 0) {
			console.warn('[WSQ_DevParams] 以下参数覆盖未生效：\n  - ' + missed.join('\n  - '));
		}
		console.log('[WSQ_DevParams] 已覆盖插件：'
			+ (Object.keys(applied).join(', ') || '（无）'));
	}

	const _Scene_Boot_start = Scene_Boot.prototype.start;
	Scene_Boot.prototype.start = function () {
		_Scene_Boot_start.apply(this, arguments);
		reportMissed();
	};

	//-------------------------------------------------------------------------
	// 脚本接口
	//-------------------------------------------------------------------------

	DP.effective = function (name) {
		return PluginManager.parameters(name);
	};
	DP.dump = function (name) {
		console.log('[WSQ_DevParams] ' + name, DP.effective(name));
	};

})();
