# 停车管理信息系统（uni-app）

基于 uni-app + Vue3 开发的跨平台停车管理信息系统，一套代码可编译至微信小程序、H5、App。系统完整实现了车辆进出场业务模型、自动计费引擎、车位统计与历史记录查询功能。


## 一、功能特性

| 模块 | 功能说明 |
|------|---------|
| 🚗 车辆入场登记 | 车牌录入/模拟识别、车辆类型选择、自动分配车位、重复入场校验、车位满员拦截 |
| 💰 出场自动计费 | 车牌查单、分时段计费、每24小时封顶、计费明细展示、在线支付、自动释放车位 |
| 🅿️ 车位统计 | 总/空闲/占用数量、使用率进度条、车位分布网格图、大小车位区分 |
| 📋 记录查询 | 按车牌搜索、在场/已出场筛选、费用汇总、记录详情、一键跳转结算 |
| 🚙 车辆管理 | 车辆增删改查、月租/临时车标记、在场车辆禁止删除 |
| ⚙️ 计费规则 | 免费时长、白天/夜间费率、时段划分、封顶金额配置、费用试算器 |
| 📊 运营看板 | 今日入场车次、今日收入、在场车辆实时列表 |

---

## 二、技术栈

- **前端框架**：uni-app（Vue3 + Options API）
- **运行平台**：微信小程序 / H5 / Android / iOS
- **数据存储**：`uni.setStorageSync`
- **开发工具**：HBuilderX 3.8+

---

## 三、快速开始

### 1. 导入项目
1. 打开 **HBuilderX**。
2. 点击 `文件` -> `导入` -> `从本地目录导入`，选择本项目文件夹即可。

### 2. 运行项目

| 平台 | 操作 |
|------|------|
| **H5** | 菜单栏 `运行` -> `运行到浏览器` -> 选择 Chrome |
| **微信小程序** | `运行` -> `运行到小程序模拟器` -> `微信开发者工具` |
| **App** | `运行` -> `运行到手机或模拟器` |

---

## 四、业务模型说明

### 4.1 车辆状态机

OUTSIDE ──入场登记──▶ ENTERING ──分配车位──▶ PARKED
│
出口识别车牌
▼
EXITED ◀──支付完成/车位释放── EXITING ◀──生成账单


### 4.2 核心数据表 (本地 Storage 模拟)

**停车记录表 records**

| 字段 | 类型 | 说明 |
|------|------|------|
| id | Number | 主键 |
| plateNumber | String | 车牌号 |
| seatNo | String | 分配车位号 |
| enterTime | String | 入场时间 |
| exitTime | String | 出场时间 |
| minutes | Number | 停车时长（分钟） |
| price | Number | 应付金额 |
| payMoney | Number | 实付金额 |
| orderNo | String | 订单号 |
| isPay | Number | 0-未支付，1-已支付 |
| bstate | Number | 0-在场，1-已出场 |

### 4.3 计费引擎算法

  js
calcFee(enterTs, exitTs, carType, rule)

1. 若 carType === 2（月租车）→ 费用 = 0，直接返回
2. 计算总时长 totalMin = (exitTs - enterTs) / 60000
3. 若 totalMin <= rule.freeMinutes → 费用 = 0，返回
4. 从 (enterTs + freeMinutes) 开始，按 30 分钟步长循环：
     - 判断当前时刻所属时段（白天/夜间）
     - 累加费用：rate × 0.5
5. 封顶校验：days = ceil(总时长 / 24h)，cap = days × rule.dayCap
     - 若累计费用 > cap，则费用 = cap

五、后续扩展方向

1. 硬件接入：对接道闸控制器、地磁传感器、LED 余位显示屏。
2. 真实车牌识别：使用 uni-app UTS 插件调用原生 OCR。
3. 无感支付：对接微信支付、支付宝。
4. WebSocket 实时推送：车位状态、进出场事件实时推送到管理端。
5. 真实后端：将 common/store.js 中的本地 Storage 替换为 uni.request 调用后端 RESTful API。

---

六、许可

本项目仅供学习与教学使用，可自由修改与分发。

### 推送步骤复习：
1. 粘贴并保存 `README.md` 后，回到项目文件夹右键打开 **Git Bash**。
2. 依次执行：
   bash
   git add .
   git commit -m "docs: 添加README说明文档"
   git push
