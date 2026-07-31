---
# 必填的 Block 标识符。请勿修改，以确保能够覆盖首页默认配置。
blockKey: home-content
# 此 Block 用于配置首页使用的结构化内容。
type: page

# 显示在店铺页头下方的首页主视觉。
hero:
  # 本地资源路径或完整图片网址。在编辑器中粘贴的图片可上传至此。
  image: /banner.png
  # 图片的无障碍描述。仅当图片纯属装饰时才留空。
  imageAlt: Featured product
  # 显示在主视觉图片正下方的简短信任或促销信息。
  tip: Secure checkout and fast delivery

# 首页的搜索引擎及社交分享元数据。
seo:
  # 浏览器标签页及搜索结果标题。
  title: 'Carto Store'
  # 搜索结果摘要。
  description: 'Discover our featured product and purchase securely online.'
  # 与首页相关的搜索关键词。
  keywords:
    - online store
    - featured product

# 控制首页购买区域显示哪些商品。
productDisplay:
  # 单个商品使用 "single"，可切换的商品标签组使用 "group"。
  mode: group
  # mode 为 "group" 时使用。每个 slug 必须对应一个已启用的店铺商品。
  group:
    products:
      - productSlug: autodesk-inventor-subscription
        # 面向顾客显示的标签名称。
        label: Inventor Professional
      - productSlug: autodesk-autocad-subscription
        label: AutoCAD
      - productSlug: autodesk-3ds-max-subscription
        label: 3ds Max
  # mode 为 "single" 时使用。slug 必须对应一个已启用的店铺商品。
  single:
    productSlug: 'autodesk-inventor-subscription'

# 显示在商品购买区域下方的可展开常见问题。
faqs:
  # 显示在常见问题列表上方的标题。
  title: Frequently Asked Questions
  items:
    # 可根据需要添加、删除或重新排序问答。
    - question: What is included with my order?
      answer: The exact contents and available options are listed in the product section above.
    - question: When will I receive my order?
      answer: Delivery timing and instructions are shown during checkout and in your order confirmation.
    - question: How do I get help?
      answer: Use the contact details in the site footer and include your order number when possible.
---
