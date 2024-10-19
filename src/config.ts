import type {
  LicenseConfig,
  NavBarConfig,
  ProfileConfig,
  SiteConfig,
} from './types/config'
import { LinkPreset } from './types/config'

export const siteConfig: SiteConfig = {
  title: '阿龙种树',
  subtitle: '全栈放',
  lang: 'zh_CN',         // 'en', 'zh_CN', 'zh_TW', 'ja', 'ko'
  themeColor: {
    hue: 270,         // 主题颜色的默认色调，从0到360。红色：0，蓝绿色：200，青色：250，粉红色：345
    fixed: false,     // 隐藏访问者的主题彩色选择器
  },
  banner: {
    enable: true,
    src: 'assets/images/bg.png',   //相对于 /SRC目录。相对于 /公共目录以' /'开头
    // src: 'assets/images/background.jpg',   //相对于 /SRC目录。相对于 /公共目录以' /'开头
    position: 'center', //等效于对象位，默认中心
    credit: {
      enable: false,         //显示横幅图像的信用文本
      text: '',              //要显示的信用文本
      url: ''                //（可选的）URL链接到原始艺术品或艺术家页面
    }
  },
  favicon: [    // Leave this array empty to use the default favicon
    // {
      //   src: '/favicon/icon.png',    // Path of the favicon, relative to the /public directory
      //   theme: 'light',              // (Optional) Either 'light' or 'dark', set only if you have different favicons for light and dark mode
      //   sizes: '32x32',              // (Optional) Size of the favicon, set only if you have favicons of different sizes
      // }
    ],
}



export const navBarConfig: NavBarConfig = {
  links: [
    LinkPreset.Home,
    LinkPreset.Archive,
    LinkPreset.About,
    {
      name: 'Rss',
      url: 'https://alongnice.github.io/rss.xml',
      external: true,
    },
    {
      name: 'GitHub',
      url: 'https://github.com/alongnice',     //内部链接不应包括基本路径，因为它会自动添加
      external: true,                             //显示外部链接图标，并将在新标签中打开
    },
  ],
}

export const profileConfig: ProfileConfig = {
  // avatar: 'assets/images/demo-avatar.png',  // Relative to the /src directory. Relative to the /public directory if it starts with '/'
  avatar: 'assets/images/al.jpg',
  name: 'Along Nice',
  bio: '悲观者正确，乐观者成功；吐槽者正确，行动者赚钱。',
  links: [
    // {
    //   name: 'Twitter',
    //   icon: 'fa6-brands:twitter',       // Visit https://icones.js.org/ for icon codes
    //                                     // You will need to install the corresponding icon set if it's not already included
    //                                     // `pnpm add @iconify-json/<icon-set-name>`
    //   url: 'https://twitter.com',
    // },
    {
      name: 'Gmail',
      icon: 'fa6-brands:gofore',
      url: 'https://mail.google.com',
    },
    {
      name: 'GitHub',
      icon: 'fa6-brands:github',
      url: 'https://github.com/alongnice',
    },
  ],
}

export const licenseConfig: LicenseConfig = {
  enable: true,
  name: 'CC BY-NC-SA 4.0',
  url: 'https://creativecommons.org/licenses/by-nc-sa/4.0/',
}
