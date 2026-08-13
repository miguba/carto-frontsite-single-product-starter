---
# 必填的 Block 标识符。请勿修改，以确保能够覆盖默认页头配置。
blockKey: header-content
# 此 Block 用于配置店铺所有页面显示的页头。
type: layout
title: Header Content

# 显示在主页头上方的促销或信任提示信息。
# text 留空时不显示顶部提示栏。
announcement:
  text: Secure checkout · Customer support · Fast fulfillment
  href: /

# 显示在主页头中的店铺标识。
# 可用占位符：{siteTitle}。
# logo 使用一张包含图形与店名的完整 Logo 图片；留空时不显示。
# logoWidth 和 logoHeight 默认为 auto，表示按图片自身尺寸自动展示。
# 支持 px、rem、em、%、vw、vh 或 auto，例如 320px、6rem、50%。
# favicon 用于浏览器标签页图标；留空时使用模板的默认图标。
branding:
  href: /
  logo: /logo.svg
  logoAlt: '{siteTitle} logo'
  logoWidth: auto
  logoHeight: auto
  favicon: /favicon.ico
---
