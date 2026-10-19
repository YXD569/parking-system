<template>
	<view class="page">
		<!-- 统计卡 -->
		<view class="stat-wrap">
			<view class="stat-card">
				<text class="stat-num">{{ stats.total }}</text>
				<text class="stat-label">总车位</text>
			</view>
			<view class="stat-card">
				<text class="stat-num green">{{ stats.free }}</text>
				<text class="stat-label">空闲</text>
			</view>
			<view class="stat-card">
				<text class="stat-num orange">{{ stats.used }}</text>
				<text class="stat-label">已占用</text>
			</view>
			<view class="stat-card">
				<text class="stat-num">{{ stats.rate }}%</text>
				<text class="stat-label">使用率</text>
			</view>
		</view>

		<!-- 进度条 -->
		<view class="card">
			<view class="card-title">车位使用率</view>
			<view class="bar">
				<view class="bar-inner" :style="{ width: stats.rate + '%' }"></view>
			</view>
			<view class="bar-text">
				<text>已占用 {{ stats.used }} 个</text>
				<text>空闲 {{ stats.free }} 个</text>
			</view>
		</view>

		<!-- 车位网格 -->
		<view class="card">
			<view class="card-title">
				<text>车位分布图</text>
				<view class="legend">
					<view class="lg-item"><view class="dot free"></view><text>空闲</text></view>
					<view class="lg-item"><view class="dot used"></view><text>占用</text></view>
				</view>
			</view>

			<view class="seat-grid">
				<view v-for="s in seats" :key="s.id"
					:class="['seat', s.status === 0 ? 'free' : 'used']"
					@click="showSeat(s)">
					<text class="seat-no">{{ s.seatNo }}</text>
					<text class="seat-type">{{ s.seatType === 2 ? '大' : '小' }}</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	import { getSeats, getStats } from '@/common/store.js'

	export default {
		data() {
			return {
				seats: [],
				stats: { total: 0, used: 0, free: 0, rate: 0 }
			}
		},
		onShow() {
			this.load()
		},
		methods: {
			load() {
				this.seats = getSeats()
				this.stats = getStats()
			},
			showSeat(s) {
				uni.showToast({
					title: `${s.seatNo} ${s.status === 0 ? '空闲中' : '已占用'}（${s.seatType === 2 ? '大型车位' : '小型车位'}）`,
					icon: 'none'
				})
			}
		}
	}
</script>

<style>
	.page { padding: 24rpx; }

	.stat-wrap { display: flex; flex-wrap: wrap; justify-content: space-between; }
	.stat-card {
		width: 48.5%;
		background: #fff;
		border-radius: 20rpx;
		padding: 36rpx 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		margin-bottom: 22rpx;
		box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
	}
	.stat-num { font-size: 52rpx; font-weight: bold; color: #2b6cff; }
	.stat-num.green { color: #19be6b; }
	.stat-num.orange { color: #ff9900; }
	.stat-label { font-size: 24rpx; color: #909399; margin-top: 10rpx; }

	.card {
		background: #fff;
		border-radius: 20rpx;
		padding: 30rpx;
		margin-bottom: 24rpx;
		box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
	}
	.card-title {
		font-size: 30rpx;
		font-weight: bold;
		margin-bottom: 26rpx;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.bar {
		height: 24rpx;
		background: #eef1f6;
		border-radius: 12rpx;
		overflow: hidden;
	}
	.bar-inner {
		height: 100%;
		background: linear-gradient(90deg, #2b6cff, #5b8dff);
		border-radius: 12rpx;
		transition: width .4s;
	}
	.bar-text {
		display: flex;
		justify-content: space-between;
		font-size: 24rpx;
		color: #909399;
		margin-top: 16rpx;
	}

	.legend { display: flex; font-size: 22rpx; color: #909399; font-weight: normal; }
	.lg-item { display: flex; align-items: center; margin-left: 24rpx; }
	.dot { width: 20rpx; height: 20rpx; border-radius: 6rpx; margin-right: 8rpx; }
	.dot.free { background: #e8f5ec; border: 2rpx solid #19be6b; }
	.dot.used { background: #ffecec; border: 2rpx solid #fa3534; }

	.seat-grid { display: flex; flex-wrap: wrap; }
	.seat {
		width: 108rpx;
		height: 108rpx;
		border-radius: 14rpx;
		margin: 0 16rpx 16rpx 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}
	.seat.free { background: #e8f5ec; border: 2rpx solid #19be6b; }
	.seat.used { background: #ffecec; border: 2rpx solid #fa3534; }
	.seat-no { font-size: 22rpx; font-weight: bold; color: #333; }
	.seat-type { font-size: 18rpx; color: #909399; margin-top: 4rpx; }
</style>
