<template>
	<view class="page">
		<view class="card">
			<view class="card-title">车辆入场登记</view>

			<view class="form-item">
				<text class="label">车牌号 <text class="req">*</text></text>
				<view class="plate-input-wrap">
					<input class="input" v-model="form.plateNumber" placeholder="如：陕A12345"
						maxlength="8" @input="onPlateInput" />
					<view class="scan-btn" @click="mockScan">识别</view>
				</view>
			</view>

			<view class="form-item">
				<text class="label">车辆类型</text>
				<view class="radio-group">
					<view :class="['radio', form.carType === 1 ? 'active' : '']" @click="form.carType = 1">
						临时车
					</view>
					<view :class="['radio', form.carType === 2 ? 'active' : '']" @click="form.carType = 2">
						月租车
					</view>
				</view>
			</view>

			<view class="form-item">
				<text class="label">车主姓名</text>
				<input class="input full" v-model="form.owner" placeholder="选填" />
			</view>

			<view class="form-item">
				<text class="label">联系电话</text>
				<input class="input full" v-model="form.phone" type="number" maxlength="11" placeholder="选填" />
			</view>

			<view class="form-item">
				<text class="label">车身颜色</text>
				<input class="input full" v-model="form.carColor" placeholder="选填，如：白色" />
			</view>

			<button class="btn-primary" @click="submit">确认入场</button>
		</view>

		<!-- 入场结果 -->
		<view class="card" v-if="result">
			<view class="card-title">入场凭证</view>
			<view class="result-row"><text class="rk">车牌号</text><text class="rv">{{ result.plateNumber }}</text></view>
			<view class="result-row"><text class="rk">分配车位</text><text class="rv big">{{ result.seatNo }}</text></view>
			<view class="result-row"><text class="rk">入场时间</text><text class="rv">{{ result.enterTime }}</text></view>
			<view class="result-row"><text class="rk">车辆类型</text><text class="rv">{{ result.carType === 2 ? '月租车' : '临时车' }}</text></view>
			<view class="tip">请按指引驶入 {{ result.seatNo }} 车位</view>
		</view>

		<view class="card">
			<view class="card-title">快捷入场（在场车辆模拟）</view>
			<view class="quick-list">
				<view v-for="p in quickPlates" :key="p" class="quick-item" @click="quickEntry(p)">{{ p }}</view>
			</view>
		</view>
	</view>
</template>

<script>
	import { entry, getInParkRecords } from '@/common/store.js'

	export default {
		data() {
			return {
				form: { plateNumber: '', carType: 1, owner: '', phone: '', carColor: '' },
				result: null,
				quickPlates: ['陕A12345', '陕B88888', '京N66666']
			}
		},
		methods: {
			onPlateInput(e) {
				this.form.plateNumber = String(e.detail.value || '').toUpperCase()
			},
			mockScan() {
				// 模拟车牌识别（真实项目可接入 UTS 原生 OCR 插件）
				uni.showLoading({ title: '识别中...' })
				setTimeout(() => {
					uni.hideLoading()
					const plates = ['陕A12345', '陕B88888', '京N66666', '粤B12345']
					const p = plates[Math.floor(Math.random() * plates.length)]
					this.form.plateNumber = p
					uni.showToast({ title: '识别成功：' + p, icon: 'none' })
				}, 800)
			},
			quickEntry(p) {
				this.form.plateNumber = p
				this.submit()
			},
			submit() {
				const res = entry(this.form)
				if (!res.ok) {
					uni.showModal({ title: '入场失败', content: res.msg, showCancel: false })
					return
				}
				this.result = res.record
				uni.showToast({ title: '入场成功', icon: 'success' })
				this.form.plateNumber = ''
				this.form.owner = ''
				this.form.phone = ''
				this.form.carColor = ''
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
	.req { color: #fa3534; }

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
	.input.full { width: 100%; }
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

	.radio-group { display: flex; }
	.radio {
		flex: 1;
		height: 84rpx;
		line-height: 84rpx;
		text-align: center;
		background: #f5f7fa;
		border-radius: 14rpx;
		font-size: 28rpx;
		color: #606266;
		margin-right: 20rpx;
		border: 2rpx solid transparent;
	}
	.radio:last-child { margin-right: 0; }
	.radio.active {
		background: #eef4ff;
		color: #2b6cff;
		border-color: #2b6cff;
		font-weight: bold;
	}

	.btn-primary {
		width: 100%;
		height: 92rpx;
		line-height: 92rpx;
		background: linear-gradient(135deg, #2b6cff, #5b8dff);
		color: #fff;
		font-size: 32rpx;
		border-radius: 46rpx;
		margin-top: 10rpx;
		border: none;
	}
	.btn-primary::after { border: none; }

	.result-row {
		display: flex;
		justify-content: space-between;
		padding: 20rpx 0;
		border-bottom: 1rpx solid #f0f2f5;
	}
	.result-row:last-of-type { border-bottom: none; }
	.rk { font-size: 26rpx; color: #909399; }
	.rv { font-size: 28rpx; color: #333; }
	.rv.big { font-size: 36rpx; font-weight: bold; color: #19be6b; }

	.tip {
		margin-top: 20rpx;
		background: #f0f9eb;
		color: #19be6b;
		font-size: 26rpx;
		padding: 20rpx;
		border-radius: 12rpx;
		text-align: center;
	}

	.quick-list { display: flex; flex-wrap: wrap; }
	.quick-item {
		padding: 16rpx 28rpx;
		background: #f5f7fa;
		border-radius: 40rpx;
		font-size: 26rpx;
		color: #2b6cff;
		margin: 0 20rpx 20rpx 0;
	}
</style>