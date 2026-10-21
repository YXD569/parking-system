<template>
	<view class="page">
		<!-- 1. 动态智能预警区域 (D进阶) -->
		<view class="warning-section">
			<view v-for="(w, i) in data.warnings" :key="i" :class="['warn-box', w.type]">
				<text class="warn-text">{{ w.text }}</text>
			</view>
		</view>

		<!-- 2. 环比核心指标 (B进阶) -->
		<view class="kpi-grid">
			<view class="kpi-card">
				<text class="kpi-label">今日营收</text>
				<view class="kpi-value-wrap">
					<text class="kpi-value">¥{{ data.todayIncome }}</text>
				</view>
				<view class="kpi-desc">
					<text>环比昨日：</text>
					<text :style="{ color: data.yoyRate >= 0 ? '#19be6b' : '#fa3534' }">
						{{ data.yoyRate >= 0 ? '↑' : '↓' }} {{ Math.abs(data.yoyRate) }}%
					</text>
				</view>
			</view>
			<view class="kpi-card">
				<text class="kpi-label">当前车位使用率</text>
				<view class="kpi-value-wrap">
					<text class="kpi-value" :style="{ color: data.usageRate > 85 ? '#fa3534' : '#2b6cff' }">{{ data.usageRate }}%</text>
				</view>
				<text class="kpi-desc">健康水位：< 80%</text>
			</view>
		</view>

		<!-- 3. 专业图表：营收趋势 (A进阶 - uCharts) -->
		<view class="chart-card">
			<view class="chart-header">近 7 天营收趋势 (元)</view>
			<view class="charts-box">
				<qiun-data-charts type="column" :chartData="chartData" :opts="chartOpts" />
			</view>
		</view>

		<!-- 4. RFM 用户分层模型 (B进阶) -->
		<view class="chart-card">
			<view class="chart-header">用户价值分层 (RFM模型)</view>
			<view class="rfm-container">
				<view class="rfm-item">
					<text class="rfm-num" style="color: #ff9900;">{{ data.vipUsers }}</text>
					<text class="rfm-label">重要价值客户</text>
					<text class="rfm-desc">高消费且高频次</text>
				</view>
				<view class="rfm-item">
					<text class="rfm-num" style="color: #2b6cff;">{{ data.highFreqUsers }}</text>
					<text class="rfm-label">高频低价值客户</text>
					<text class="rfm-desc">频次高但客单价低</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	import { getAdvancedDashboardData } from '@/common/store.js'

	export default {
		data() {
			return {
				data: {
					trendDays: [],
					trendRevenue: [],
					todayIncome: 0,
					yoyRate: 0,
					vipUsers: 0,
					highFreqUsers: 0,
					warnings: [],
					usageRate: 0
				},
				// uCharts 图表数据
				chartData: {},
				// uCharts 图表配置
				chartOpts: {
					color: ["#2b6cff", "#19be6b", "#ff9900"],
					padding: [15, 15, 0, 5],
					enableScroll: false,
					legend: { show: false },
					xAxis: {
						disableGrid: true,
						itemCount: 7
					},
					yAxis: {
						gridType: "dash",
						dashLength: 2
					},
					extra: {
						column: {
							type: "group",
							width: 20,
							activeBgColor: "#000000",
							activeBgOpacity: 0.08,
							linearType: "custom"
						}
					}
				}
			}
		},
		onShow() {
			this.data = getAdvancedDashboardData()
			this.initChart()
		},
		methods: {
			initChart() {
				// 将数据转化为 uCharts 需要的格式
				const res = {
					categories: this.data.trendDays,
					series: [
						{
							name: "营收",
							data: this.data.trendRevenue
						}
					]
				};
				this.chartData = JSON.parse(JSON.stringify(res));
			}
		}
	}
</script>

<style>
	.page {
		background-color: #f5f6fa;
		min-height: 100vh;
		padding: 30rpx;
	}

	/* 动态预警 */
	.warning-section {
		margin-bottom: 24rpx;
	}
	.warn-box {
		padding: 20rpx 24rpx;
		border-radius: 12rpx;
		margin-bottom: 16rpx;
		font-size: 24rpx;
	}
	.warn-box.danger { background: #ffefef; color: #fa3534; border-left: 8rpx solid #fa3534; }
	.warn-box.warning { background: #fff7e6; color: #ff9900; border-left: 8rpx solid #ff9900; }
	.warn-box.success { background: #f0f9eb; color: #19be6b; border-left: 8rpx solid #19be6b; }
	.warn-text { font-weight: bold; }

	/* KPI 卡片 */
	.kpi-grid {
		display: flex;
		justify-content: space-between;
		margin-bottom: 24rpx;
	}
	.kpi-card {
		width: 48%;
		background: #fff;
		border-radius: 20rpx;
		padding: 30rpx;
		box-sizing: border-box;
		box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.04);
	}
	.kpi-label {
		font-size: 26rpx;
		color: #606266;
	}
	.kpi-value-wrap {
		margin: 16rpx 0 10rpx;
	}
	.kpi-value {
		font-size: 46rpx;
		font-weight: bold;
		color: #2b6cff;
	}
	.kpi-desc {
		font-size: 22rpx;
		color: #909399;
	}

	/* 图表卡片 */
	.chart-card {
		background: #fff;
		border-radius: 20rpx;
		padding: 30rpx;
		margin-bottom: 24rpx;
		box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.04);
	}
	.chart-header {
		font-size: 28rpx;
		font-weight: bold;
		color: #333;
		margin-bottom: 20rpx;
		padding-left: 16rpx;
		border-left: 8rpx solid #2b6cff;
		line-height: 1;
	}
	.charts-box {
		width: 100%;
		height: 400rpx;
	}

	/* RFM 分层 */
	.rfm-container {
		display: flex;
		justify-content: space-around;
		padding: 20rpx 0;
	}
	.rfm-item {
		display: flex;
		flex-direction: column;
		align-items: center;
	}
	.rfm-num {
		font-size: 56rpx;
		font-weight: bold;
	}
	.rfm-label {
		font-size: 26rpx;
		color: #333;
		font-weight: bold;
		margin: 10rpx 0;
	}
	.rfm-desc {
		font-size: 22rpx;
		color: #909099;
	}
</style>
