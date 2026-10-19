<template>
	<view class="page">
		<!-- 顶部概览 -->
		<view class="hero">
			<view class="hero-title">停车管理信息系统</view>
			<view class="hero-date">{{ today }} {{ week }}</view>

			<view class="hero-stats">
				<view class="hs-item">
					<text class="hs-num">{{ stats.total }}</text>
					<text class="hs-label">总车位</text>
				</view>
				<view class="hs-item">
					<text class="hs-num green">{{ stats.free }}</text>
					<text class="hs-label">空闲</text>
				</view>
				<view class="hs-item">
					<text class="hs-num orange">{{ stats.used }}</text>
					<text class="hs-label">已占用</text>
				</view>
				<view class="hs-item">
					<text class="hs-num">{{ stats.rate }}%</text>
					<text class="hs-label">使用率</text>
				</view>
			</view>

			<view class="progress">
				<view class="progress-inner" :style="{ width: stats.rate + '%' }"></view>
			</view>
		</view>

		<!-- 今日运营 -->
		<view class="card">
			<view class="card-title">今日运营</view>
			<view class="row">
				<view class="row-item">
					<text class="row-num">{{ todayStats.count }}</text>
					<text class="row-label">入场车次</text>
				</view>
				<view class="row-item">
					<text class="row-num">¥{{ todayStats.income.toFixed(2) }}</text>
					<text class="row-label">今日收入</text>
				</view>
			</view>
		</view>

		<!-- 功能导航 -->
		<view class="card">
			<view class="card-title">功能菜单</view>
			<view class="grid">
				<view class="grid-item" v-for="m in menus" :key="m.path" @click="go(m.path)">
					<view class="grid-icon" :style="{ background: m.color }">
						<text class="grid-emoji">{{ m.icon }}</text>
					</view>
					<text class="grid-text">{{ m.name }}</text>
				</view>
			</view>
		</view>

		<!-- 在场车辆 -->
		<view class="card">
			<view class="card-title">
				<text>当前在场车辆</text>
				<text class="more" @click="go('/pages/record/record?status=in')">查看全部 ›</text>
			</view>

			<view v-if="inPark.length === 0" class="empty">暂无在场车辆</view>

			<view v-for="r in inPark" :key="r.id" class="list-item" @click="go('/pages/record/record')">
				<view class="plate">{{ r.plateNumber }}</view>
				<view class="list-info">
					<text class="list-sub">车位 {{ r.seatNo }}</text>
					<text class="list-sub">入场 {{ r.enterTime.slice(5, 16) }}</text>
				</view>
			</view>
		</view>

		<view class="footer">
			<text class="btn-reset" @click="reset">重置演示数据</text>
		</view>
	</view>
</template>

<script>
	import {
		getStats, getInParkRecords, getTodayStats, resetDB, formatTime
	} from '@/common/store.js'

	export default {
		data() {
			return {
				stats: { total: 0, used: 0, free: 0, rate: 0 },
				todayStats: { count: 0, income: 0 },
				inPark: [],
				today: '',
				week: '',
				menus: [
					{ name: '入场登记', icon: '🚗', color: '#2b6cff', path: '/pages/entry/entry' },
					{ name: '出场计费', icon: '💰', color: '#19be6b', path: '/pages/exit/exit' },
					{ name: '车位统计', icon: '🅿️', color: '#ff9900', path: '/pages/seat/seat' },
					{ name: '记录查询', icon: '📋', color: '#8a5cff', path: '/pages/record/record' },
					{ name: '车辆管理', icon: '🚙', color: '#00c1d4', path: '/pages/vehicle/vehicle' },
					{ name: '计费规则', icon: '⚙️', color: '#fa3534', path: '/pages/rule/rule' }
				]
			}
		},
		onLoad() {
			const d = new Date()
			const weeks = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
			this.today = formatTime(d.getTime()).slice(0, 10)
			this.week = weeks[d.getDay()]
		},
		onShow() {
			this.loadData()
		},
		onPullDownRefresh() {
			this.loadData()
			setTimeout(() => uni.stopPullDownRefresh(), 300)
		},
		methods: {
			loadData() {
				this.stats = getStats()
				this.todayStats = getTodayStats()
				this.inPark = getInParkRecords()
			},
			go(path) {
				uni.navigateTo({ url: path })
			},
			reset() {
				uni.showModal({
					title: '提示',
					content: '确定重置全部演示数据吗？',
					success: (res) => {
						if (res.confirm) {
							resetDB()
							this.loadData()
							uni.showToast({ title: '已重置', icon: 'success' })
						}
					}
				})
			}
		}
	}
</script>

<style>
	.page { padding-bottom: 60rpx; }

	/* Hero */
	.hero {
		background: linear-gradient(135deg, #2b6cff 0%, #5b8dff 100%);
		padding: 50rpx 40rpx 60rpx;
		border-radius: 0 0 40rpx 40rpx;
		color: #fff;
	}
	.hero-title { font-size: 40rpx; font-weight: bold; }
	.hero-date { font-size: 24rpx; opacity: 0.85; margin-top: 10rpx; }

	.hero-stats {
		display: flex;
		margin-top: 44rpx;
	}
	.hs-item { flex: 1; display: flex; flex-direction: column; align-items: center; }
	.hs-num { font-size: 44rpx; font-weight: bold; }
	.hs-num.green { color: #a8ff9e; }
	.hs-num.orange { color: #ffd98a; }
	.hs-label { font-size: 22rpx; opacity: 0.85; margin-top: 8rpx; }

	.progress {
		margin-top: 40rpx;
		height: 12rpx;
		background: rgba(255, 255, 255, 0.28);
		border-radius: 6rpx;
		overflow: hidden;
	}
	.progress-inner {
		height: 100%;
		background: #fff;
		border-radius: 6rpx;
		transition: width .4s;
	}

	/* Card */
	.card {
		background: #fff;
		margin: 24rpx 24rpx 0;
		border-radius: 20rpx;
		padding: 30rpx;
		box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
	}
	.card-title {
		font-size: 30rpx;
		font-weight: bold;
		margin-bottom: 24rpx;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	.more { font-size: 24rpx; color: #909399; font-weight: normal; }

	/* Row */
	.row { display: flex; }
	.row-item { flex: 1; display: flex; flex-direction: column; align-items: center; }
	.row-num { font-size: 42rpx; font-weight: bold; color: #2b6cff; }
	.row-label { font-size: 24rpx; color: #909399; margin-top: 8rpx; }

	/* Grid */
	.grid { display: flex; flex-wrap: wrap; }
	.grid-item {
		width: 33.33%;
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 24rpx 0;
	}
	.grid-icon {
		width: 90rpx;
		height: 90rpx;
		border-radius: 26rpx;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.grid-emoji { font-size: 42rpx; }
	.grid-text { font-size: 24rpx; color: #333; margin-top: 14rpx; }

	/* List */
	.list-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 22rpx 0;
		border-bottom: 1rpx solid #f0f2f5;
	}
	.list-item:last-child { border-bottom: none; }
	.plate {
		font-size: 30rpx;
		font-weight: bold;
		color: #2b6cff;
		background: #eef4ff;
		padding: 8rpx 20rpx;
		border-radius: 10rpx;
	}
	.list-info { display: flex; flex-direction: column; align-items: flex-end; }
	.list-sub { font-size: 24rpx; color: #909399; line-height: 36rpx; }

	.empty {
		text-align: center;
		color: #c0c4cc;
		font-size: 26rpx;
		padding: 50rpx 0;
	}

	.footer { display: flex; justify-content: center; margin-top: 40rpx; }
	.btn-reset {
		font-size: 26rpx;
		color: #909399;
		border: 1rpx solid #dcdfe6;
		padding: 14rpx 40rpx;
		border-radius: 40rpx;
	}
</style>
