<template>
	<view class="page">
		<!-- 搜索栏 -->
		<view class="search-bar">
			<input class="search-input" v-model="keyword" placeholder="输入车牌号搜索"
				confirm-type="search" @confirm="load" />
			<view class="search-btn" @click="load">搜索</view>
		</view>

		<!-- 状态筛选 -->
		<view class="tabs">
			<view v-for="t in tabs" :key="t.value"
				:class="['tab', status === t.value ? 'active' : '']"
				@click="switchTab(t.value)">
				{{ t.label }}
			</view>
		</view>

		<!-- 汇总 -->
		<view class="summary">
			<text>共 {{ list.length }} 条记录</text>
			<text class="sum-fee">合计 ¥{{ totalFee.toFixed(2) }}</text>
		</view>

		<!-- 记录列表 -->
		<view v-for="r in list" :key="r.id" class="rec-card">
			<view class="rec-head">
				<text class="rec-plate">{{ r.plateNumber }}</text>
				<text :class="['rec-tag', r.bstate === 0 ? 'tag-in' : 'tag-out']">
					{{ r.bstate === 0 ? '在场中' : '已出场' }}
				</text>
			</view>

			<view class="rec-row"><text class="rec-label">车位号</text><text class="rec-val">{{ r.seatNo }}</text></view>
			<view class="rec-row"><text class="rec-label">入场时间</text><text class="rec-val">{{ r.enterTime }}</text></view>
			<view class="rec-row"><text class="rec-label">出场时间</text><text class="rec-val">{{ r.exitTime || '—' }}</text></view>
			<view class="rec-row" v-if="r.bstate === 1">
				<text class="rec-label">停车时长</text><text class="rec-val">{{ fmtDuration(r.minutes) }}</text>
			</view>

			<view class="rec-foot" v-if="r.bstate === 1">
				<text class="rec-order">订单号：{{ r.orderNo }}</text>
				<text class="rec-fee">¥{{ (r.payMoney || 0).toFixed(2) }}</text>
			</view>
			<view class="rec-foot" v-else>
				<text class="rec-order">车辆正在场内停放</text>
				<text class="rec-btn" @click="toExit(r.plateNumber)">去结算</text>
			</view>
		</view>

		<view v-if="list.length === 0" class="empty">暂无符合条件的记录</view>
	</view>
</template>

<script>
	import { getRecords, fmtDuration } from '@/common/store.js'

	export default {
		data() {
			return {
				keyword: '',
				status: '',
				list: [],
				tabs: [
					{ label: '全部', value: '' },
					{ label: '在场中', value: 'in' },
					{ label: '已出场', value: 'out' }
				]
			}
		},
		computed: {
			totalFee() {
				return this.list.reduce((s, r) => s + (r.payMoney || 0), 0)
			}
		},
		onLoad(options) {
			if (options && options.status) this.status = options.status
		},
		onShow() {
			this.load()
		},
		methods: {
			fmtDuration,
			load() {
				this.list = getRecords({ plateNumber: this.keyword, status: this.status })
			},
			switchTab(v) {
				this.status = v
				this.load()
			},
			toExit(plate) {
				uni.navigateTo({ url: '/pages/exit/exit?plate=' + plate })
			}
		}
	}
</script>

<style>
	.page { padding: 24rpx; }

	.search-bar { display: flex; margin-bottom: 22rpx; }
	.search-input {
		flex: 1;
		height: 84rpx;
		background: #fff;
		border-radius: 42rpx;
		padding: 0 32rpx;
		font-size: 28rpx;
	}
	.search-btn {
		width: 150rpx;
		height: 84rpx;
		line-height: 84rpx;
		text-align: center;
		background: #2b6cff;
		color: #fff;
		border-radius: 42rpx;
		font-size: 28rpx;
		margin-left: 20rpx;
	}

	.tabs { display: flex; margin-bottom: 22rpx; }
	.tab {
		flex: 1;
		height: 72rpx;
		line-height: 72rpx;
		text-align: center;
		background: #fff;
		border-radius: 14rpx;
		font-size: 27rpx;
		color: #606266;
		margin-right: 16rpx;
	}
	.tab:last-child { margin-right: 0; }
	.tab.active { background: #2b6cff; color: #fff; font-weight: bold; }

	.summary {
		display: flex;
		justify-content: space-between;
		font-size: 25rpx;
		color: #909399;
		padding: 0 10rpx 20rpx;
	}
	.sum-fee { color: #fa3534; font-weight: bold; }

	.rec-card {
		background: #fff;
		border-radius: 20rpx;
		padding: 28rpx;
		margin-bottom: 22rpx;
		box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
	}
	.rec-head {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-bottom: 20rpx;
		border-bottom: 1rpx dashed #ebeef5;
		margin-bottom: 16rpx;
	}
	.rec-plate { font-size: 34rpx; font-weight: bold; color: #2b6cff; letter-spacing: 2rpx; }
	.rec-tag {
		font-size: 22rpx;
		padding: 6rpx 20rpx;
		border-radius: 20rpx;
	}
	.tag-in { background: #f0f9eb; color: #19be6b; }
	.tag-out { background: #f4f4f5; color: #909399; }

	.rec-row { display: flex; justify-content: space-between; padding: 12rpx 0; }
	.rec-label { font-size: 26rpx; color: #909399; }
	.rec-val { font-size: 27rpx; color: #333; }

	.rec-foot {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-top: 16rpx;
		padding-top: 20rpx;
		border-top: 1rpx solid #f0f2f5;
	}
	.rec-order { font-size: 23rpx; color: #c0c4cc; }
	.rec-fee { font-size: 36rpx; font-weight: bold; color: #fa3534; }
	.rec-btn {
		font-size: 25rpx;
		color: #fff;
		background: #19be6b;
		padding: 10rpx 30rpx;
		border-radius: 30rpx;
	}

	.empty {
		text-align: center;
		color: #c0c4cc;
		font-size: 27rpx;
		padding: 120rpx 0;
	}
</style>