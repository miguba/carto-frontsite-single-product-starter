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
    - question: What is included with this product subscription?
      answer: You receive the software subscription option selected in the purchase section. Delivery details, activation information, or redemption instructions are sent by email after payment confirmation and order review.
    - question: Is this delivered digitally?
      answer: Yes. This is a digital software subscription. Please enter a valid email address at checkout because order confirmation and delivery instructions are sent there.
    - question: When can I expect to receive my order?
      answer: All products include free digital delivery in the United States, with an estimated delivery time of 0–1 business days after payment confirmation.
    - question: Are there any region, language, or account requirements?
      answer: Yes. This offer is available for purchase and use in the United States, Canada, United Kingdom, and Australia only, is provided in English, and requires a valid Autodesk account set to one of these countries.
    - question: Can I download updates?
      answer: Downloads and updates are available for the 2025, 2026, and 2027 versions. You can select the release that best matches your needs.
    - question: What should I do if I need help after purchase?
      answer: Contact support with your order number and checkout email address. We can help with delivery status, order verification, and subscription questions.
---
