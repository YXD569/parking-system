<template>
	<view class="page">
		<!-- 搜索 -->
		<view class="search-bar">
			<input class="search-input" v-model="keyword" placeholder="搜索车牌号 / 车主"
				confirm-type="search" @confirm="load" @input="load" />
			<view class="search-btn" @click="openAdd">＋ 新增</view>
		</view>

		<!-- 车辆列表 -->
		<view v-for="v in list" :key="v.id" class="v-card">
			<view class="v-head">
				<text class="v-plate">{{ v.plateNumber }}</text>
				<text :class="['v-tag', v.carType === 2 ? 'tag-month' : 'tag-temp']">
					{{ v.carType === 2 ? '月租车' : '临时车' }}
				</text>
			</view>
			<view class="v-row"><text class="v-label">车主</text><text class="v-val">{{ v.owner || '—' }}</text></view>
			<view class="v-row"><text class="v-label">电话</text><text class="v-val">{{ v.phone || '—' }}</text></view>
			<view class="v-row"><text class="v-label">车身颜色</text><text class="v-val">{{ v.carColor }}</text></view>
			<view class="v-row"><text class="v-label">建档时间</text><text class="v-val">{{ v.createTime }}</text></view>

			<view class="v-actions">
				<view class="act-btn" @click="openEdit(v)">编辑</view>
				<view class="act-btn danger" @click="remove(v)">删除</view>
			</view>
		</view>

		<view v-if="list.length === 0" class="empty">暂无车辆信息</view>

		<!-- 弹窗表单 -->
		<view class="mask" v-if="showModal" @click="showModal = false"></view>
		<view class="modal" v-if="showModal">
			<view class="modal-title">{{ form.id ? '编辑车辆' : '新增车辆' }}</view>

			<view class="m-item">
				<text class="m-label">车牌号 <text class="req">*</text></text>
				<input class="m-input" v-model="form.plateNumber" placeholder="如：陕A12345" maxlength="8" />
			</view>

			<view class="m-item">
				<text class="m-label">车辆类型</text>
				<view class="radio-group">
					<view :class="['radio', form.carType === 1 ? 'active' : '']" @click="form.carType = 1">临时车</view>
					<view :class="['radio', form.carType === 2 ? 'active' : '']" @click="form.carType = 2">月租车</view>
				</view>
			</view>

			<view class="m-item">
				<text class="m-label">车主姓名</text>
				<input class="m-input" v-model="form.owner" placeholder="请输入" />
			</view>

			<view class="m-item">
				<text class="m-label">联系电话</text>
				<input class="m-input" v-model="form.phone" type="number" maxlength="11" placeholder="请输入" />
			</view>

			<view class="m-item">
				<text class="m-label">车身颜色</text>
				<input class="m-input" v-model="form.carColor" placeholder="如：白色" />
			</view>

			<view class="modal-btns">
				<view class="m-btn cancel" @click="showModal = false">取消</view>
				<view class="m-btn confirm" @click="save">保存</view>
			</view>
		</view>
	</view>
</template>

<script>
	import { getVehicles, addVehicle, updateVehicle, deleteVehicle } from '@/common/store.js'

	const emptyForm = () => ({ id: null, plateNumber: '', carType: 1, owner: '', phone: '', carColor: '' })

	export default {
		data() {
			return {
				keyword: '',
				list: [],
				showModal: false,
				form: emptyForm()
			}
		},
		onShow() {
			this.load()
		},
		methods: {
			load() {
				this.list = getVehicles(this.keyword)
			},
			openAdd() {
				this.form = emptyForm()
				this.showModal = true
			},
			openEdit(v) {
				this.form = { ...v }
				this.showModal = true
			},
			save() {
				const res = this.form.id ? updateVehicle(this.form) : addVehicle(this.form)
				if (!res.ok) {
					uni.showToast({ title: res.msg, icon: 'none' })
					return
				}
				uni.showToast({ title: res.msg, icon: 'success' })
				this.showModal = false
				this.load()
			},
			remove(v) {
				uni.showModal({
					title: '提示',
					content: `确定删除车辆 ${v.plateNumber} 吗？`,
					success: (r) => {
						if (!r.confirm) return
						const res = deleteVehicle(v.id)
						uni.showToast({ title: res.msg, icon: res.ok ? 'success' : 'none' })
						if (res.ok) this.load()
					}
				})
			}
		}
	}
</script>

<style>
	.page { padding: 24rpx; }

	.search-bar { display: flex; margin-bottom: 24rpx; }
	.search-input {
		flex: 1;
		height: 84rpx;
		background: #fff;
		border-radius: 42rpx;
		padding: 0 32rpx;
		font-size: 28rpx;
	}
	.search-btn {
		width: 180rpx;
		height: 84rpx;
		line-height: 84rpx;
		text-align: center;
		background: #2b6cff;
		color: #fff;
		border-radius: 42rpx;
		font-size: 28rpx;
		margin-left: 20rpx;
	}

	.v-card {
		background: #fff;
		border-radius: 20rpx;
		padding: 28rpx;
		margin-bottom: 22rpx;
		box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
	}
	.v-head {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-bottom: 20rpx;
		border-bottom: 1rpx dashed #ebeef5;
		margin-bottom: 16rpx;
	}
	.v-plate { font-size: 34rpx; font-weight: bold; color: #2b6cff; letter-spacing: 2rpx; }
	.v-tag { font-size: 22rpx; padding: 6rpx 20rpx; border-radius: 20rpx; }
	.tag-month { background: #fff7e6; color: #ff9900; }
	.tag-temp { background: #f4f4f5; color: #909399; }

	.v-row { display: flex; justify-content: space-between; padding: 12rpx 0; }
	.v-label { font-size: 26rpx; color: #909399; }
	.v-val { font-size: 27rpx; color: #333; }

	.v-actions {
		display: flex;
		justify-content: flex-end;
		margin-top: 20rpx;
		padding-top: 20rpx;
		border-top: 1rpx solid #f0f2f5;
	}
	.act-btn {
		font-size: 26rpx;
		color: #2b6cff;
		border: 1rpx solid #2b6cff;
		padding: 10rpx 36rpx;
		border-radius: 30rpx;
		margin-left: 20rpx;
	}
	.act-btn.danger { color: #fa3534; border-color: #fa3534; }

	.empty {
		text-align: center;
		color: #c0c4cc;
		font-size: 27rpx;
		padding: 120rpx 0;
	}

	/* 弹窗 */
	.mask {
		position: fixed;
		left: 0; top: 0; right: 0; bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		z-index: 98;
	}
	.modal {
		position: fixed;
		left: 60rpx; right: 60rpx;
		top: 50%;
		transform: translateY(-50%);
		background: #fff;
		border-radius: 24rpx;
		padding: 40rpx;
		z-index: 99;
		max-height: 80vh;
		overflow-y: auto;
	}
	.modal-title {
		font-size: 32rpx;
		font-weight: bold;
		text-align: center;
		margin-bottom: 34rpx;
	}
	.m-item { margin-bottom: 26rpx; }
	.m-label { font-size: 26rpx; color: #606266; display: block; margin-bottom: 12rpx; }
	.req { color: #fa3534; }
	.m-input {
		height: 80rpx;
		background: #f5f7fa;
		border-radius: 12rpx;
		padding: 0 24rpx;
		font-size: 28rpx;
	}
	.radio-group { display: flex; }
	.radio {
		flex: 1;
		height: 80rpx;
		line-height: 80rpx;
		text-align: center;
		background: #f5f7fa;
		border-radius: 12rpx;
		font-size: 27rpx;
		color: #606266;
		margin-right: 20rpx;
		border: 2rpx solid transparent;
	}
	.radio:last-child { margin-right: 0; }
	.radio.active { background: #eef4ff; color: #2b6cff; border-color: #2b6cff; font-weight: bold; }

	.modal-btns { display: flex; margin-top: 40rpx; }
	.m-btn {
		flex: 1;
		height: 84rpx;
		line-height: 84rpx;
		text-align: center;
		border-radius: 42rpx;
		font-size: 29rpx;
	}
	.m-btn.cancel { background: #f5f7fa; color: #606266; margin-right: 20rpx; }
	.m-btn.confirm { background: #2b6cff; color: #fff; }
</style>