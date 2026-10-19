<template>
	<view class="page">
		<view class="card">
			<view class="card-title">出场自动计费</view>

			<view class="form-item">
				<text class="label">车牌号</text>
				<view class="plate-input-wrap">
					<input class="input" v-model="plate" placeholder="请输入车牌号"
						maxlength="8" @input="onInput" />
					<view class="scan-btn" @click="mockScan">识别</view>
				</view>
			</view>

			<button class="btn-primary" @click="query">查询账单</button>
		</view>

		<!-- 在场车辆快捷选择 -->
		<view class="card" v-if="inPark.length">
			<view class="card-title">在场车辆</view>
			<view class="quick-list">
				<view v-for="r in inPark" :key="r.id" class="quick-item" @click="quickPick(r.plateNumber)">
					{{ r.plateNumber }}
				</view>
			</view>
		</view>

		<!-- 账单 -->
		<view class="card bill" v-if="bill">
			<view class="bill-head">
				<text class="bill-plate">{{ bill.plateNumber }}</text>
				<text class="bill-tag">{{ bill.carType === 2 ? '月租车' : '临时车' }}</text>
			</view>

			<view class="bill-row"><text class="bk">车位号</text><text class="bv">{{ bill.seatNo }}</text></view>
			<view class="bill-row"><text class="bk">入场时间</text><text class="bv">{{ bill.enterTime }}</text></view>
			<view class="bill-row"><text class="bk">出场时间</text><text class="bv">{{ bill.exitTime }}</text></view>
			<view class="bill-row"><text class="bk">停车时长</text><text class="bv">{{ bill.duration }}</text></view>

			<view class="seg-box" v-if="bill.segments.length">
				<view class="seg-title">计费明细（{{ bill.segments.length }} 段）</view>
				<scroll-view scroll-y class="seg-list">
					<view v-for="(s, i) in bill.segments" :key="i" class="seg-item">
						<text class="seg-time">{{ s.time }}</text>
						<text class="seg-period">{{ s.period }}</text>
						<text class="seg-rate">{{ s.rate }}元/时</text>
						<text class="seg-add">+{{ s.add.toFixed(2) }}</text>
					</view>
				</scroll-view>
			</view>

			<view class="bill-total">
				<text class="total-label">应付金额</text>
				<text class="total-num">¥{{ bill.price.toFixed(2) }}</text>
			</view>
			<view class="bill-detail">{{ bill.detail }}</view>

			<button class="btn-pay" @click="pay">
				{{ bill.price === 0 ? '免费通行' : '确认支付 ¥' + bill.price.toFixed(2) }}
			</button>
		</view>

		<!-- 支付结果 -->
		<view class="card success" v-if="paid">
			<view class="success-icon">✓</view>
			<view class="success-title">支付成功</view>
			<view class="bill-row"><text class="bk">订单号</text><text class="bv">{{ paid.orderNo }}</text></view>
			<view class="bill-row"><text class="bk">实付金额</text><text class="bv">¥{{ paid.payMoney.toFixed(2) }}</text></view>
			<view class="bill-row"><text class="bk">出场时间</text><text class="bv">{{ paid.exitTime }}</text></view>
			<view class="tip">闸机已抬杆，祝您一路平安</view>
		</view>
	</view>
</template>

<script>
	import { queryBill, payBill, getInParkRecords } from '@/common/store.js'

	export default {
		data() {
			return {
				plate: '',
				bill: null,
				paid: null,
				inPark: []
			}
		},
		onShow() {
			this.inPark = getInParkRecords()
		},
		methods: {
			onInput(e) {
				this.plate = String(e.detail.value || '').toUpperCase()
			},
			mockScan() {
				uni.showLoading({ title: '识别中...' })
				setTimeout(() => {
					uni.hideLoading()
					if (this.inPark.length) {
						this.plate = this.inPark[0].plateNumber
					} else {
						this.plate = '陕B66666'
					}
					uni.showToast({ title: '识别成功', icon: 'none' })
				}, 700)
			},
			quickPick(p) {
				this.plate = p
				this.query()
			},
			query() {
				const res = queryBill(this.plate)
				if (!res.ok) {
					uni.showModal({ title: '查询失败', content: res.msg, showCancel: false })
					this.bill = null
					return
				}
				this.paid = null
				this.bill = res
			},
			pay() {
				if (!this.bill) return
				uni.showLoading({ title: '支付中...' })
				setTimeout(() => {
					uni.hideLoading()
					const res = payBill(this.bill.recordId)
					if (!res.ok) {
						uni.showToast({ title: res.msg, icon: 'none' })
						return
					}
					this.paid = res.record
					this.bill = null
					this.plate = ''
					this.inPark = getInParkRecords()
					uni.showToast({ title: '支付成功', icon: 'success' })
				}, 900)
			}
		}
	}
</script>

<style>
	.page { padding: 24rpx; }

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
		margin-bottom: 30rpx;
		padding-left: 16rpx;
		border-left: 8rpx solid #2b6cff;
		line-height: 1;
	}

	.form-item { margin-bottom: 30rpx; }
	.label { font-size: 26rpx; color: #606266; display: block; margin-bottom: 14rpx; }

	.plate-input-wrap { display: flex; align-items: center; }
	.input {
		flex: 1;
		height: 84rpx;
		background: #f5f7fa;
		border-radius: 14rpx;
		padding: 0 24rpx;
		font-size: 30rpx;
		letter-spacing: 2rpx;
	}
	.scan-btn {
		width: 140rpx;
		height: 84rpx;
		line-height: 84rpx;
		text-align: center;
		background: #2b6cff;
		color: #fff;
		border-radius: 14rpx;
		font-size: 28rpx;
		margin-left: 20rpx;
	}

	.btn-primary {
		width: 100%;
		height: 92rpx;
		line-height: 92rpx;
		background: linear-gradient(135deg, #2b6cff, #5b8dff);
		color: #fff;
		font-size: 32rpx;
		border-radius: 46rpx;
		border: none;
	}
	.btn-primary::after { border: none; }

	.quick-list { display: flex; flex-wrap: wrap; }
	.quick-item {
		padding: 16rpx 28rpx;
		background: #f5f7fa;
		border-radius: 40rpx;
		font-size: 26rpx;
		color: #2b6cff;
		margin: 0 20rpx 20rpx 0;
	}

	/* 账单 */
	.bill-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding-bottom: 24rpx;
		border-bottom: 1rpx dashed #ebeef5;
		margin-bottom: 20rpx;
	}
	.bill-plate { font-size: 36rpx; font-weight: bold; color: #2b6cff; letter-spacing: 2rpx; }
	.bill-tag {
		font-size: 22rpx;
		color: #ff9900;
		background: #fff7e6;
		padding: 6rpx 18rpx;
		border-radius: 20rpx;
	}

	.bill-row {
		display: flex;
		justify-content: space-between;
		padding: 16rpx 0;
	}
	.bk { font-size: 26rpx; color: #909399; }
	.bv { font-size: 28rpx; color: #333; }

	.seg-box {
		margin-top: 20rpx;
		background: #fafbfc;
		border-radius: 14rpx;
		padding: 20rpx;
	}
	.seg-title { font-size: 24rpx; color: #909399; margin-bottom: 14rpx; }
	.seg-list { max-height: 320rpx; }
	.seg-item {
		display: flex;
		justify-content: space-between;
		font-size: 24rpx;
		color: #606266;
		padding: 10rpx 0;
	}
	.seg-time { width: 140rpx; }
	.seg-period { width: 100rpx; color: #909399; }
	.seg-rate { flex: 1; text-align: right; padding-right: 24rpx; color: #909399; }
	.seg-add { width: 110rpx; text-align: right; color: #fa3534; }

	.bill-total {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		margin-top: 30rpx;
		padding-top: 24rpx;
		border-top: 1rpx solid #f0f2f5;
	}
	.total-label { font-size: 28rpx; color: #606266; }
	.total-num { font-size: 56rpx; font-weight: bold; color: #fa3534; }

	.bill-detail {
		font-size: 24rpx;
		color: #909399;
		margin-top: 12rpx;
	}

	.btn-pay {
		width: 100%;
		height: 92rpx;
		line-height: 92rpx;
		background: linear-gradient(135deg, #19be6b, #43d17e);
		color: #fff;
		font-size: 32rpx;
		border-radius: 46rpx;
		margin-top: 30rpx;
		border: none;
	}
	.btn-pay::after { border: none; }

	/* 支付成功 */
	.success { text-align: center; }
	.success-icon {
		width: 120rpx;
		height: 120rpx;
		line-height: 120rpx;
		border-radius: 50%;
		background: #19be6b;
		color: #fff;
		font-size: 64rpx;
		margin: 20rpx auto 24rpx;
	}
	.success-title { font-size: 36rpx; font-weight: bold; margin-bottom: 30rpx; }
	.success .bill-row { border-bottom: 1rpx solid #f0f2f5; }
	.success .bill-row:last-of-type { border-bottom: none; }

	.tip {
		margin-top: 24rpx;
		background: #f0f9eb;
		color: #19be6b;
		font-size: 26rpx;
		padding: 20rpx;
		border-radius: 12rpx;
	}
</style>
