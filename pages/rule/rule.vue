<template>
	<view class="page">
		<view class="card">
			<view class="card-title">计费规则配置</view>

			<view class="f-item">
				<text class="f-label">免费时长（分钟）</text>
				<input class="f-input" type="number" v-model="form.freeMinutes" />
			</view>

			<view class="f-item">
				<text class="f-label">白天费率（元/小时）</text>
				<input class="f-input" type="number" v-model="form.dayRate" />
			</view>

			<view class="f-item">
				<text class="f-label">夜间费率（元/小时）</text>
				<input class="f-input" type="number" v-model="form.nightRate" />
			</view>

			<view class="f-item">
				<text class="f-label">白天开始时间（时）</text>
				<input class="f-input" type="number" v-model="form.dayStart" />
			</view>

			<view class="f-item">
				<text class="f-label">白天结束时间（时）</text>
				<input class="f-input" type="number" v-model="form.dayEnd" />
			</view>

			<view class="f-item">
				<text class="f-label">24小时封顶（元）</text>
				<input class="f-input" type="number" v-model="form.dayCap" />
			</view>

			<button class="btn-save" @click="save">保存规则</button>
		</view>

		<!-- 试算器 -->
		<view class="card">
			<view class="card-title">费用试算器</view>
			<view class="f-item">
				<text class="f-label">停车时长（分钟）</text>
				<input class="f-input" type="number" v-model="testMinutes" />
			</view>
			<view class="f-item">
				<text class="f-label">车辆类型</text>
				<view class="radio-group">
					<view :class="['radio', testCarType === 1 ? 'active' : '']" @click="testCarType = 1">临时车</view>
					<view :class="['radio', testCarType === 2 ? 'active' : '']" @click="testCarType = 2">月租车</view>
				</view>
			</view>

			<view class="test-result">
				<text class="tr-label">预计费用</text>
				<text class="tr-num">¥{{ testFee.toFixed(2) }}</text>
			</view>
		</view>

		<view class="card">
			<view class="card-title">当前规则说明</view>
			<view class="desc">
				<text>· 停车前 {{ form.freeMinutes }} 分钟免费</text>
				<text>· {{ form.dayStart }}:00 - {{ form.dayEnd }}:00 按 {{ form.dayRate }} 元/小时计费</text>
				<text>· {{ form.dayEnd }}:00 - 次日 {{ form.dayStart }}:00 按 {{ form.nightRate }} 元/小时计费</text>
				<text>· 不足 30 分钟按 30 分钟计</text>
				<text>· 每 24 小时最高收费 {{ form.dayCap }} 元</text>
				<text>· 月租车免费通行</text>
			</view>
		</view>
	</view>
</template>

<script>
	import { getRule, saveRule, calcFee, formatTime } from '@/common/store.js'

	export default {
		data() {
			return {
				form: {
					freeMinutes: 15,
					dayRate: 5,
					nightRate: 3,
					dayStart: 8,
					dayEnd: 20,
					dayCap: 40
				},
				testMinutes: 120,
				testCarType: 1
			}
		},
		computed: {
			testFee() {
				const now = Date.now()
				const enter = now - Number(this.testMinutes) * 60000
				const res = calcFee(enter, now, this.testCarType, this.form)
				return res.fee
			}
		},
		onShow() {
			this.form = { ...getRule() }
		},
		methods: {
			save() {
				const res = saveRule(this.form)
				uni.showToast({ title: res.msg, icon: 'success' })
				this.form = { ...getRule() }
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

	.f-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 22rpx 0;
		border-bottom: 1rpx solid #f5f7fa;
	}
	.f-label { font-size: 27rpx; color: #606266; }
	.f-input {
		width: 220rpx;
		height: 72rpx;
		background: #f5f7fa;
		border-radius: 12rpx;
		padding: 0 24rpx;
		font-size: 28rpx;
		text-align: right;
	}

	.radio-group { display: flex; width: 340rpx; }
	.radio {
		flex: 1;
		height: 72rpx;
		line-height: 72rpx;
		text-align: center;
		background: #f5f7fa;
		border-radius: 12rpx;
		font-size: 26rpx;
		color: #606266;
		margin-left: 16rpx;
		border: 2rpx solid transparent;
	}
	.radio.active { background: #eef4ff; color: #2b6cff; border-color: #2b6cff; font-weight: bold; }

	.btn-save {
		width: 100%;
		height: 92rpx;
		line-height: 92rpx;
		background: linear-gradient(135deg, #2b6cff, #5b8dff);
		color: #fff;
		font-size: 32rpx;
		border-radius: 46rpx;
		margin-top: 36rpx;
		border: none;
	}
	.btn-save::after { border: none; }

	.test-result {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		margin-top: 30rpx;
		padding-top: 26rpx;
		border-top: 1rpx dashed #ebeef5;
	}
	.tr-label { font-size: 28rpx; color: #606266; }
	.tr-num { font-size: 52rpx; font-weight: bold; color: #fa3534; }

	.desc { display: flex; flex-direction: column; }
	.desc text {
		font-size: 26rpx;
		color: #606266;
		line-height: 52rpx;
	}
</style>
