# 创作板块使用说明

创作板块（`/works/`）用来放世界观、人物设定和故事正文，和博客文章完全分开：
不会出现在主页列表、归档、标签、分类、系列和 RSS 里，但**可以被站内搜索搜到**。

## 目录结构

```
src/content/works/
  作品目录名/
    index.md              作品主页内容（简介等），标题、封面、状态写这里
    world/                世界观条目
    浮空城.md
    characters/           人物条目
    林墨.md
    stories/              故事正文
    第一章-塔顶的灯.md
```

- **作品 = 一级目录**，目录名就是 URL 的一段，可以用中文
- **分区 = 二级目录**，目录名固定为 `world` / `characters` / `stories`，
  显示名（世界观 / 人物 / 正文）在 `src/config/worksConfig.ts` 里改
- 条目下可以再建子目录，例如 `world/地理/山脉.md` → `/works/作品/world/地理/山脉/`
- URL 完全由目录结构决定，**不要**在创作内容的 frontmatter 里写 `slug`

生成的 URL：

| 内容 | URL |
| --- | --- |
| 作品列表 | `/works/` |
| 作品主页 | `/works/<作品>/` |
| 分区列表 | `/works/<作品>/<分区>/` |
| 条目详情 | `/works/<作品>/<分区>/<条目>/` |

## frontmatter 字段

作品主页（`index.md`）和条目用的是同一套 schema：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `title` | 是 | 标题 |
| `published` | 否 | 发布日期。设定类条目可以不写；写了会用于排序和显示 |
| `updated` | 否 | 更新时间 |
| `draft` | 否 | 草稿，只在开发环境可见（默认 `false`） |
| `order` | 否 | 同分区内排序。**正文写章节号**，人物/世界观可以用来定展示顺序和分类先后 |
| `description` | 否 | 摘要，显示在卡片和详情页 |
| `image` | 否 | 人物页当圆形头像，世界观/正文当封面；支持 `./相对路径`、`/public 路径`、网络地址 |
| `category` | 否 | **世界观 / 人物的分类**，用来在列表里分组显示；留空归入「未分类」 |
| `status` | 否 | 作品状态，如「连载中」「已完结」，只用于作品卡片和作品主页 |
| `tags` | 否 | 标签数组，世界观/人物列表页会用它们做筛选按钮 |
| `comment` | 否 | 是否开启评论，默认 `true` |

排序规则：`order` 升序 → 发布日期升序 → 标题。正文因此按章节号 1、2、3 排，
「上一章 / 下一章」也按这个顺序算。分类分组的先后同样跟着这个排序走
（把 `order` 小的条目排在前面，它所在的分类就排在前面）。

## 折叠、分类与筛选

- **作品主页**（`/works/<作品>/`）的三个分区（世界观 / 人物 / 正文）整块可折叠，
  右侧栏显示本页目录（来自作品 `index.md` 的标题）
- **世界观 / 人物**按 `category` 分组显示，每个分组也可以折叠
- **分区列表页**（`/works/<作品>/world/`、`/characters/`）显示完整列表，
  并提供**按标签筛选**的按钮；筛选时命中的条目所在分组会自动展开，空分组整组隐藏
- 作品主页是节选（`worksConfig.previewCount` 条），所以那里不提供筛选——
  对截断后的结果做筛选会漏掉没显示出来的条目，要筛选用「查看全部」进分区列表页
- 正文不分组、不筛选，按章节顺序平铺

折叠的默认状态在 `src/config/worksConfig.ts`：

```ts
sectionsCollapsedByDefault: false,    // 作品主页的三个分区默认是否折叠
categoriesCollapsedByDefault: false,  // 分类分组默认是否折叠
```

把 `categoriesCollapsedByDefault` 设为 `true`，作品主页会变成
「分区 → 分类名 + 条数」的两级索引，比较紧凑。

## 双链（互相链接）

沿用主题的 Obsidian 风格语法，**文章和创作内容之间可以互相链接**：

```markdown
行内提到 [[林墨]] 会变成普通链接。

单独成段的双链会渲染成卡片：

[[林墨]]

指向某个小节：[[第一章-塔顶的灯#守夜]]
起别名：[[林墨|那个守塔人]]
写完整路径消歧：[[示例作品/characters/林墨]]
```

小节锚点由标题自动生成（`## 守夜` → `#守夜`），标题里**不要**手写 `{#自定义 id}`，
这个主题的 markdown 管线不认那种语法，会把它当成标题正文的一部分。

目标解析优先级（跨 `posts` 与 `works` 一起找）：

1. frontmatter 的 `slug`
2. 精确路径，例如 `浮空城`、`示例作品/world/浮空城`
3. 全站唯一的裸文件名
4. 全站唯一的 `title` —— 所以文件叫 `lin-mo.md`、标题是「林墨」时，写 `[[林墨]]` 也能命中

重名（两部作品里都有「林墨」）时会跳过并在构建日志里警告，这时需要写成更长的路径。
链接到不存在的内容也会在构建日志里警告。

## 开关与配置

- `src/config/siteConfig.ts` 里的 `pages.works` 控制整个板块，设为 `false` 会 404 并隐藏导航项，
  也可以用环境变量 `PUBLIC_PAGES_WORKS=false` 覆盖
- `src/config/worksConfig.ts` 放页面文案与行为：
  - `singleWorkMode`：只有一部作品时，`/works/` 直接显示该作品主页
  - `previewCount`：作品主页每个分区展示的条数上限
  - `sectionsCollapsedByDefault` / `categoriesCollapsedByDefault`：折叠的默认状态
  - `uncategorizedText`：没写 `category` 的条目归到哪一组
- 导航栏菜单项在 `src/config/navBarConfig.ts` 的 `LinkPresets.Works`

## 删除示例内容

`src/content/works/示例作品/` 整个目录可以直接删掉，删掉后板块会显示空态。
