// ============================================================
//  合成小屋 · 游戏数据配置（日常更新只需要改这个文件）
// ============================================================
//  · 加新房子：在 houses 末尾追加一项。已上线的房子只能往后追加，
//    不要删除、不要调换顺序——玩家的星星和进度是按「第几栋第几关」记的。
//  · 预告房子：status 写 'soon'，首页会显示带锁的「敬请期待」卡片；
//    做好 12 关后改成 'open' 就正式开放（status:'open' 的房子必须正好 12 关）。
//  · 调难度：改每关的 goals（目标建材:数量），步数会自动按新目标重新计算。
//  · 建材编号：材料名 + 等级，等级从 0 开始。例如 stone2 = 石头链第 3 级「石砖」。
// ============================================================
window.GAME_DATA = {
  dataVersion: 1,

  // 建材链：每种 6 级，gen 是材料箱名称（目前所有关卡共用一个材料箱）
  materials: {
    wood: {"gen":"木料箱","items":["树枝","原木","木板","木梁","木门","木屋架"]},
    stone: {"gen":"石料箱","items":["碎石","石块","石砖","石柱","石阶","石墙"]},
    brick: {"gen":"泥土筐","items":["泥土","泥坯","红砖","砖堆","砖墙","烟囱"]},
    glass: {"gen":"沙袋","items":["沙子","玻璃珠","玻璃片","窗框","玻璃窗","彩绘窗"]},
    tile: {"gen":"黏土桶","items":["黏土","瓦坯","青瓦","瓦摞","屋檐","屋顶"]},
    bamboo: {"gen":"竹篓","items":["竹笋","竹节","竹竿","竹排","竹墙","竹屋顶"]},
    shell: {"gen":"贝壳篮","items":["小贝壳","扇贝","海螺","珍珠","贝壳风铃","珍珠灯"]},
    rope: {"gen":"麻绳筐","items":["麻线","麻绳","渔网","吊床","帆布","风帆"]},
    ice: {"gen":"冰窖","items":["雪花","雪球","冰块","冰砖","冰柱","冰晶灯"]},
    wool: {"gen":"羊毛袋","items":["羊毛","毛线团","毛毡","毛毯","挂毯","门帘"]},
    pine: {"gen":"松木堆","items":["松果","松枝","松木","木柴堆","雪橇","圣诞树"]},
    marble: {"gen":"石匠箱","items":["石英砂","大理石块","雕花石砖","罗马柱","石拱门","城墙垛"]},
    iron: {"gen":"铁匠炉","items":["铁矿石","铁锭","铁条","铁链","铁栅栏","城门"]},
    gem: {"gen":"宝石匣","items":["碎晶","水晶","宝石","宝石烛台","玫瑰窗","王冠"]},
    pot: {"gen":"陶土堆","items":["红土","土坯砖","陶碗","陶罐","彩陶瓶","陶灯"]},
    palm: {"gen":"棕榈篮","items":["椰子","棕榈苗","棕榈叶","棕榈席","遮阳棚","棕榈树"]},
    cactus: {"gen":"花盆","items":["仙人掌芽","小仙人掌","仙人掌","开花仙人掌","仙人掌盆栽","仙人掌篱笆"]},
    oak: {"gen":"橡木箱","items":["橡果","橡树苗","橡木枝","踏板","树屋平台","树屋门"]},
    mush: {"gen":"蘑菇篮","items":["孢子","小蘑菇","红蘑菇","蘑菇丛","蘑菇凳","蘑菇屋顶"]},
    glow: {"gen":"萤火罐","items":["露珠","萤火虫","萤火瓶","萤石","萤光串灯","萤火灯笼"]}
  },

  houses: [
    {
      id: "cabin", name: "小木屋", status: 'open',
      doneTheme: 1,          // 盖完后首页卡片用的场景
      themes: [0,1,2,3,4,5,6,7,8,9,10,11],   // 每关的场景编号
      decor: ["小狗","秋千","金风向标"],   // 12★ / 24★ / 36★ 解锁的装饰
      levels: [
        {"name":"打地基","goals":{"stone2":5,"brick1":4},"gens":["stone","brick"]},
        {"name":"铺地板","goals":{"wood2":6,"stone2":2},"gens":["wood","stone"]},
        {"name":"砌墙","goals":{"brick4":2,"brick2":2,"stone1":2},"gens":["brick","stone"]},
        {"name":"立柱子","goals":{"stone3":4,"wood3":2},"gens":["stone","wood"]},
        {"name":"装大门","goals":{"wood4":2,"wood2":3,"stone2":2},"gens":["wood","stone"]},
        {"name":"开窗户","goals":{"glass4":2,"glass3":2,"wood2":3},"gens":["glass","wood"]},
        {"name":"搭屋架","goals":{"wood5":1,"wood3":3,"stone3":1},"gens":["wood","stone"]},
        {"name":"盖屋顶","goals":{"tile5":1,"tile4":2,"wood3":1},"gens":["tile","wood"]},
        {"name":"砌烟囱","goals":{"brick5":2,"stone2":4},"gens":["brick","stone"]},
        {"name":"修台阶","goals":{"stone4":4,"brick2":5},"gens":["stone","brick"]},
        {"name":"围篱笆","goals":{"wood3":8,"stone3":3},"gens":["wood","stone"]},
        {"name":"点亮灯火","goals":{"glass5":2,"glass4":1,"wood4":1},"gens":["glass","wood"]}
      ]
    },
    {
      id: "beach", name: "海边竹屋", status: 'open',
      doneTheme: 3,          // 盖完后首页卡片用的场景
      themes: [3,0,2,5,3,7,1,9,3,10,7,11],   // 每关的场景编号
      decor: ["冲浪板","小帆船","金贝壳"],   // 12★ / 24★ / 36★ 解锁的装饰
      levels: [
        {"name":"打竹桩","goals":{"bamboo2":8,"rope1":4}},
        {"name":"铺竹甲板","goals":{"bamboo3":4,"rope1":4,"shell1":2}},
        {"name":"搭竹墙","goals":{"bamboo4":2,"bamboo2":2,"rope1":4}},
        {"name":"编屋顶","goals":{"bamboo5":1,"bamboo3":2,"rope1":4}},
        {"name":"挂渔网","goals":{"rope2":10,"shell2":3,"bamboo2":2}},
        {"name":"装风铃","goals":{"shell4":3,"rope1":4,"bamboo2":2}},
        {"name":"绑吊床","goals":{"rope3":5,"bamboo3":2,"shell2":3}},
        {"name":"立桅杆","goals":{"bamboo2":8,"rope4":2,"shell3":1}},
        {"name":"铺贝壳路","goals":{"shell3":6,"shell2":6,"rope1":2}},
        {"name":"挂珍珠灯","goals":{"shell5":2,"rope2":4}},
        {"name":"搭栈桥","goals":{"bamboo3":6,"bamboo4":2,"rope1":4}},
        {"name":"扬帆之夜","goals":{"rope5":2,"shell4":1,"bamboo4":1,"shell3":1}}
      ]
    },
    {
      id: "igloo", name: "冰雪小屋", status: 'open',
      doneTheme: 8,          // 盖完后首页卡片用的场景
      themes: [8,9,8,0,8,7,8,9,8,5,8,11],   // 每关的场景编号
      decor: ["雪人","企鹅","极光王冠"],   // 12★ / 24★ / 36★ 解锁的装饰
      levels: [
        {"name":"堆雪基","goals":{"ice2":6,"ice1":4,"pine1":4}},
        {"name":"铺松木地板","goals":{"pine2":8,"ice2":2,"wool1":2}},
        {"name":"砌冰墙","goals":{"ice3":5,"wool1":4}},
        {"name":"盖冰穹顶","goals":{"ice3":6,"ice2":2,"pine1":2}},
        {"name":"挖门洞","goals":{"ice4":2,"ice2":4,"pine2":3}},
        {"name":"铺毛毡","goals":{"wool2":12,"wool1":4,"pine2":2}},
        {"name":"挂门帘","goals":{"wool5":1,"wool3":2,"ice2":3}},
        {"name":"劈柴堆","goals":{"pine3":7,"wool2":3,"ice2":1}},
        {"name":"做雪橇","goals":{"pine4":3,"wool3":2,"ice2":3}},
        {"name":"挂冰柱","goals":{"ice4":4,"pine2":4}},
        {"name":"种圣诞树","goals":{"pine5":2,"wool4":1,"ice3":2}},
        {"name":"极光之夜","goals":{"ice5":2,"wool5":1,"pine4":1}}
      ]
    },
    {
      id: "castle", name: "山顶城堡", status: 'open',
      doneTheme: 9,          // 盖完后首页卡片用的场景
      themes: [9,4,6,1,5,2,10,7,0,6,9,11],   // 每关的场景编号
      decor: ["城堡旗帜","骑士雕像","金色城门"],   // 12★ / 24★ / 36★ 解锁的装饰
      levels: [
        {"name":"奠城基","goals":{"marble2":8,"marble1":4,"iron1":4}},
        {"name":"砌城墙","goals":{"marble2":10,"marble1":4,"iron1":2}},
        {"name":"立罗马柱","goals":{"marble3":6,"gem1":4}},
        {"name":"筑拱门","goals":{"marble4":2,"marble2":4,"iron1":6}},
        {"name":"铸铁栅","goals":{"iron4":2,"iron2":6,"marble1":4}},
        {"name":"装城门","goals":{"iron5":1,"iron3":3,"marble2":3}},
        {"name":"建塔楼","goals":{"marble3":6,"marble4":1,"gem2":2}},
        {"name":"架吊桥","goals":{"iron3":6,"iron2":4,"marble2":3}},
        {"name":"镶玫瑰窗","goals":{"gem4":3,"gem2":4,"marble3":2}},
        {"name":"摆宝石烛台","goals":{"gem3":8,"iron2":4,"marble1":4}},
        {"name":"砌城垛","goals":{"marble5":2,"iron3":2,"gem2":4}},
        {"name":"加冕之夜","goals":{"gem5":2,"marble5":1,"iron4":1}}
      ]
    },
    {
      id: "desert", name: "沙漠土屋", status: 'open',
      doneTheme: 12,          // 盖完后首页卡片用的场景
      themes: [12,0,12,7,12,2,12,7,12,5,12,11],   // 每关的场景编号
      decor: ["骆驼","绿洲","金陶罐"],   // 12★ / 24★ / 36★ 解锁的装饰
      levels: [
        {"name":"平整沙地","goals":{"pot1":16,"palm1":4}},
        {"name":"砌土坯墙","goals":{"pot1":14,"pot2":3,"palm1":2}},
        {"name":"抹泥墙","goals":{"pot2":9,"pot1":4,"cactus1":2}},
        {"name":"架屋梁","goals":{"palm3":4,"palm2":4,"pot1":4}},
        {"name":"铺棕榈顶","goals":{"palm3":5,"palm2":4,"cactus1":2}},
        {"name":"挂遮阳棚","goals":{"palm4":3,"pot2":4}},
        {"name":"摆陶罐","goals":{"pot3":7,"cactus1":6}},
        {"name":"种仙人掌","goals":{"cactus3":6,"cactus2":4,"palm1":4}},
        {"name":"围仙人掌篱","goals":{"cactus5":2,"cactus2":3,"pot1":2}},
        {"name":"挂陶灯","goals":{"pot5":2,"palm2":5}},
        {"name":"种棕榈树","goals":{"palm5":2,"cactus3":2,"pot2":2}},
        {"name":"沙漠星夜","goals":{"pot5":2,"cactus4":2,"palm4":1}}
      ]
    },
    {
      id: "treehouse", name: "森林树屋", status: 'open',
      doneTheme: 13,          // 盖完后首页卡片用的场景
      themes: [13,4,13,1,13,9,13,6,13,4,13,11],   // 每关的场景编号
      decor: ["松鼠","秋千","金萤火灯"],   // 12★ / 24★ / 36★ 解锁的装饰
      levels: [
        {"name":"清理林地","goals":{"oak2":8,"mush1":4}},
        {"name":"钉踏板","goals":{"oak3":4,"oak1":4,"glow1":2}},
        {"name":"搭树屋平台","goals":{"oak4":2,"oak2":2,"mush1":4}},
        {"name":"立护栏","goals":{"oak3":5,"mush2":3}},
        {"name":"装树屋门","goals":{"oak5":1,"oak3":2,"glow1":4}},
        {"name":"盖蘑菇屋顶","goals":{"mush5":1,"mush3":3,"oak1":2}},
        {"name":"摆蘑菇凳","goals":{"mush4":3,"mush2":4}},
        {"name":"挂萤火瓶","goals":{"glow2":11,"oak2":4,"mush1":4}},
        {"name":"铺萤石小路","goals":{"glow3":6,"mush2":4,"oak1":4}},
        {"name":"搭木梯","goals":{"oak3":8,"glow2":3}},
        {"name":"挂串灯","goals":{"glow4":3,"mush3":4}},
        {"name":"萤火之夜","goals":{"glow5":2,"mush4":1,"oak5":1}}
      ]
    },
    // ---------- 以下是预告中的房子（首页显示为带锁卡片） ----------
    { id: 'lighthouse', name: '海角灯塔', status: 'soon', teaser: '悬崖上的白色灯塔' },
    { id: 'windmill',   name: '风车农场', status: 'soon', teaser: '麦田里的大风车' }
  ]
};
