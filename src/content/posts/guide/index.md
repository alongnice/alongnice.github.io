---
title: 本博客基本使用方法
published: 2024-10-19
description: "如何使用这份模板？"
image: "./cover.jpeg"
tags: ["博客模板","基本语法"]
category: 模板
draft: false
---

Cover image source: [Source](cover.jpg)

此博客模板是由 [Astro](https://astro.build/). 对于本指南中未提及的内容，您可能会在 [Astro Docs](https://docs.astro.build/).

## 帖子的前后

```yaml
---
title: 我的第一篇博客文章
published: 2024-09-09
description: 这是我新的Astro博客的第一篇文章.
image: ./cover.jpg
tags: [Foo, Bar]
category: Front-end
draft: false
---
```

| 标签     |描述           |
|---------------|-----------------------|
| `title`       | 标题.|
| `published`   | 发布日期.|
| `description` | 帖子的简短描述。显示在索引页面上.|
| `image`       | 帖子的封面图像路径.<br/>1. 网络图片 `http://` or `https://`: <br/>2. 本地图片  `/`: 在 `public` 目录<br/>3. 没有前缀：相对于md文件 |
| `tags`        | 帖子的标签.|
| `category`    | 帖子的类别.|
| `draft`        | 如果这篇文章仍然是草稿，那将不会显示.|

## 在哪里放置文件

您的帖子文件应放置在`src/content/posts/`目录中。您还可以创建子目录以更好地组织您的帖子和资产。

```
src/content/posts/
├── post-1.md
└── post-2/
    ├── cover.png
    └── index.md
```

## 语法
段落用空白行分开。

第二段。 _斜体_，**粗体**和 `单域`。逐项列表
看起来像：

- 这个
- 那个
- 另一个

请注意 ---不考虑星号--- 实际文本
内容从4个列开始。

>块引号为
>像这样写。
>
>它们可以跨越多个段落，
>如果您愿意。

使用3个破折号进行EM仪表板。使用2个破折号进行范围（例如，“全部
在第12--14章中）。三个点...将转换为省略号。支持Unicode。 ☺

## H2标头

这是一个编号列表：

1. 第一项
2. 第二项
3. 第三项

再次注意实际文本如何以4列的4列开始（4个字符
从左侧）。这是一个代码样本：

    # Let me re-iterate ...
    for i in 1 .. 10 { do-something(i) }

正如您可能猜到的那样，缩进了4个空间。顺便说一句，而不是
缩进块，如果您愿意，可以使用划界块：

```
define foobar() {
    print "Welcome to flavor country!";
}
```

（这使复制和粘贴更容易）。您可以选择标记
pandoc的划界块以语法强调了它：


```python
import time
# Quick, count to ten!
for i in range(10):
    # (but not *too* quick)
    time.sleep(0.5)
    print i
```

### H3标头

现在一个嵌套列表：

1. 首先，获取这些成分：

 - 胡萝卜
 - 芹菜
 - 小扁豆

2. 煮一些水。

3. 将所有东西都倾倒在锅中并跟随
 该算法：

 
        find wooden spoon
        uncover pot
        stir
        cover pot
        balance wooden spoon precariously on pot handle
        wait 10 minutes
        goto first step (or shut off burner when done)


    不要撞木勺，否则会掉落。

再次注意文本如何始终在4空间凹痕上排队（包括
最后一行继续上述项目3）。

这是[网站](http://foo.bar)，[localdoc](localdoc.html)的链接，以及[currentDoc中的一个部分](#语法)。这是一个脚注  [^1].

[^1]: 脚注的描述。

# 视频插入

只需从YouTube或其他平台复制嵌入代码，然后将其粘贴到Markdown文件中。

```yaml
---
title: Include Video in the Post
published: 2023-10-19
// ...
---

<iframe width="100%" height="468" src="https://youtu.be/aB3R3O-Ak5Y?si=Q9rFt4GbWLAZ82jT" title="YouTube video player" frameborder="0" allowfullscreen></iframe>
```

## YouTube

<iframe width="800" height="400" src="https://www.youtube.com/embed/aB3R3O-Ak5Y?si=Q9rFt4GbWLAZ82jT" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

## Bilibili

<iframe width="800" height="500"  src="//player.bilibili.com/player.html?isOutside=true&aid=1205434445&bvid=BV1gf421X771&cid=1566619993&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>

> 
> 

# 扩展语法


## GitHub 代码库卡片
您可以添加动态卡片，链接到 GitHub 代码库，页面加载时，代码库信息从 GitHub API 中获取。

::github{repo="alongnice/myddns"}

使用代码 `::github{repo="<owner>/<repo>"}` 创建一个 GitHub 代码库卡片。

```markdown
::github{repo="saicaca/fuwari"}
```

## 警告框

以下类型的警告框受到支持: `note` `tip` `important` `warning` `caution`

:::note
突出显示用户应考虑的信息，即使快速浏览。
:::

:::tip
可选信息，以帮助用户更成功。
:::

:::important
至关重要的信息，对于用户成功至关重要。
:::

:::warning
由于潜在风险，需要立即引起用户注意的关键内容。
:::

:::caution
行动的负面潜在后果。
:::

```markdown
:::note
突出显示用户应考虑的信息，即使快速浏览。
:::

:::tip
可选信息，以帮助用户更成功。
:::
```

警告框的标题可以自定义。


:::note[MY CUSTOM TITLE]
这是一个带有自定义标题的提示。
:::

```markdown
:::note[MY CUSTOM TITLE]
这是一个带有自定义标题的提示。
:::
```

> [!TIP]
> [ GitHub 语法](https://github.com/orgs/community/discussions/16925) 也支持.

```
> [!NOTE]
> GitHub 语法也受支持。

> [!TIP]
> GitHub 语法也受支持。
```