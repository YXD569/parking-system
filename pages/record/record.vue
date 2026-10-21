<template>
	<view class="page">
		<!-- 顶部多维筛选区 (取数面板) -->
		<view class="filter-panel">
			<view class="filter-row">
				<input class="search-input" v-model="query.keyword" placeholder="搜索车牌号..." @confirm="handleSearch" />
				<button class="btn-query" @click="handleSearch">查询</button>
			</view>
			
			<view class="filter-row date-row">
				<picker mode="date" :value="query.startDate" @change="e => { query.startDate = e.detail.value; handleSearch() }">
					<view class="date-picker">{{ query.startDate || '开始日期' }}</view>
				</picker>
				<text class="date-sep">至</text>
				<picker mode="date" :value="query.endDate" @change="e => { query.endDate = e.detail.value; handleSearch() }">
					<view class="date-picker">{{ query.endDate || '结束日期' }}</view>
				</picker>
				<view class="reset-btn" @click="resetFilter">重置</view>
			</view>

			<view class="status-tabs">
				<view v-for="tab in statusTabs" :key="tab.value" 
					  :class="['tab', query.status === tab.value ? 'active' : '']"
					  @click="switchStatus(tab.value)">
					{{ tab.label }}
				</view>
			</view>
		</view>

		<!-- 统计看板 & 导出 -->
		<view class="summary-bar">
			<view class="summary-data">
				<text>共 <text class="highlight">{{ totalCount }}</text> 条记录</text>
				<text>总金额: <text class="highlight">¥{{ totalAmount }}</text></text>
			</view>
			<view class="action-btns">
				<view class="btn-clean" @click="handleClean">一键清洗</view>
				<view class="btn-export" @click="handleExport">导出CSV</view>
			</view>
		</view>

		<!-- 数据列表 -->
		<view class="data-list">
			<view v-for="r in list" :key="r.id" class="data-card">
				<view class="card-head">
					<text class="plate">{{ r.plateNumber }}</text>
					<text :class="['tag', r.isPay === 1 ? 'tag-paid' : 'tag-unpaid']">
						{{ r.isPay === 1 ? '已支付' : '未支付' }}
					</text>
				</view>
				<view class="card-body">
					<view class="info-row"><text class="label">入场时间:</text>{{ r.enterTime }}</view>
					<view class="info-row"><text class="label">出场时间:</text>{{ r.exitTime || '---' }}</view>
					<view class="info-row"><text class="label">车位/时长:</text>{{ r.seatNo }} | {{ r.minutes }}分钟</view>
				</view>
				<view class="card-foot">
					<text>流水号: {{ r.orderNo || '未结算' }}</text>
					<text class="amount">¥{{ (r.payMoney || 0).toFixed(2) }}</text>
				</view>
			</view>
		</view>

		<!-- 分页器 -->
		<view class="pagination" v-if="totalCount > 0">
			<view :class="['page-btn', query.page === 1 ? 'disabled' : '']" @click="changePage(-1)">上一页</view>
			<text class="page-info">{{ query.page }} / {{ totalPages }}</text>
			<view :class="['page-btn', query.page >= totalPages ? 'disabled' : '']" @click="changePage(1)">下一页</view>
		</view>
		<view v-if="list.length === 0" class="empty">没有找到符合条件的数据，请调整筛选条件。</view>
	</view>
</template>

<script>
	import { advancedQueryRecords, cleanAnomalyData } from '@/common/store.js'

	export default {
		data() {
			return {
				query: {
					keyword: '',
					status: 'all',
					startDate: '',
					endDate: '',
					page: 1,
					pageSize: 10
				},
				list: [],
				totalCount: 0,
				totalAmount: 0,
				totalPages: 1,
				statusTabs: [
					{ label: '全部', value: 'all' },
					{ label: '已支付', value: 'paid' },
					{ label: '未支付', value: 'unpaid' },
					{ label: '在场中', value: 'in_park' }
				]
			}
		},
		onShow() {
			this.fetchData()
		},
		methods: {
			async fetchData() {
				const res = await advancedQueryRecords(this.query)
				this.list = res.list
				this.totalCount = res.totalCount
				this.totalAmount = res.totalAmount
				this.totalPages = res.totalPages
			},
			handleSearch() {
				this.query.page = 1 // 搜索重置到第一页
				this.fetchData()
			},
			resetFilter() {
				this.query.keyword = ''
				this.query.startDate = ''
				this.query.endDate = ''
				this.query.status = 'all'
				this.handleSearch()
			},
			switchStatus(val) {
				this.query.status = val
				this.handleSearch()
			},
			changePage(step) {
				const newPage = this.query.page + step
				if (newPage >= 1 && newPage <= this.totalPages) {
					this.query.page = newPage
					this.fetchData()
				}
			},
			handleClean() {
				uni.showModal({
					title: '数据清洗警告',
					content: '将自动清理入场超过7天未出场的异常“僵尸车”流水，是否继续？',
					success: (res) => {
						if (res.confirm) {
							const count = cleanAnomalyData()
							uni.showToast({ title: `已清洗 ${count} 条异常数据`, icon: 'none' })
							this.fetchData()
						}
					}
				})
			},
			// 核心：前端数据导出 (ETL - Export)
			handleExport() {
				if (this.list.length === 0) return uni.showToast({ title: '没有数据可导出', icon: 'none' })
				
				uni.showLoading({ title: '生成报表中...' })
				
				// 1. 构建 CSV 表头
				let csvContent = "车牌号,入场时间,出场时间,车位号,停车时长(分),应付金额,订单号,支付状态\n"
				
				// 2. 遍历数据拼接 (注意处理逗号和换行符，防止破坏 CSV 结构)
				this.list.forEach(r => {
					const status = r.isPay === 1 ? '已支付' : '未支付'
					csvContent += `${r.plateNumber},${r.enterTime},${r.exitTime || '-'},${r.seatNo},${r.minutes},${r.payMoney || 0},${r.orderNo || '-'},${status}\n`
				})

				// 3. 处理中文乱码 (加 BOM 头) & 执行下载
				const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
				const url = URL.createObjectURL(blob)
				const link = document.createElement('a')
				link.href = url
				link.setAttribute('download', `停车报表_${new Date().getTime()}.csv`)
				document.body.appendChild(link)
				link.click()
				document.body.removeChild(link)
				
				setTimeout(() => {
					uni.hideLoading()
					uni.showToast({ title: '导出成功', icon: 'success' })
				}, 500)
			}
		}
	}
</script>

<style>
	.page {
		background: #f5f6fa;
		min-height: 100vh;
		padding-bottom: 40rpx;
	}

	/* 筛选面板 */
	.filter-panel {
		background: #fff;
		padding: 24rpx;
		border-bottom: 1rpx solid #ebeef5;
	}
	.filter-row {
		display: flex;
		align-items: center;
		margin-bottom: 20rpx;
	}
	.search-input {
		flex: 1;
		height: 72rpx;
		background: #f5f7fa;
		border-radius: 36rpx;
		padding: 0 30rpx;
		font-size: 26rpx;
		margin-right: 20rpx;
	}
	.btn-query {
		width: 140rpx;
		height: 72rpx;
		line-height: 72rpx;
		background: #2b6cff;
		color: #fff;
		font-size: 26rpx;
		border-radius: 36rpx;
		padding: 0;
		margin: 0;
	}
	.btn-query::after { border: none; }

	.date-row {
		justify-content: space-between;
	}
	.date-picker {
		width: 200rpx;
		height: 60rpx;
		line-height: 60rpx;
		background: #f5f7fa;
		text-align: center;
		font-size: 24rpx;
		border-radius: 10rpx;
		color: #606266;
	}
	.date-sep {
		font-size: 24rpx;
		color: #909399;
	}
	.reset-btn {
		font-size: 24rpx;
		color: #2b6cff;
		text-decoration: underline;
	}

	.status-tabs {
		display: flex;
		margin-top: 10rpx;
	}
	.tab {
		flex: 1;
		text-align: center;
		font-size: 26rpx;
		color: #606266;
		padding: 12rpx 0;
		border-radius: 8rpx;
	}
	.tab.active {
		background: #eef4ff;
		color: #2b6cff;
		font-weight: bold;
	}

	/* 统计看板 */
	.summary-bar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 20rpx 24rpx;
		background: #fff;
		margin-top: 20rpx;
	}
	.summary-data {
		display: flex;
		flex-direction: column;
		font-size: 24rpx;
		color: #606266;
		line-height: 36rpx;
	}
	.highlight {
		color: #fa3534;
		font-weight: bold;
		font-size: 28rpx;
	}
	.action-btns {
		display: flex;
	}
	.btn-clean, .btn-export {
		font-size: 24rpx;
		padding: 10rpx 20rpx;
		border-radius: 8rpx;
		margin-left: 16rpx;
	}
	.btn-clean {
		color: #fa3534;
		border: 1rpx solid #fa3534;
	}
	.btn-export {
		color: #fff;
		background: #19be6b;
	}

	/* 数据列表 */
	.data-list {
		padding: 24rpx;
	}
	.data-card {
		background: #fff;
		border-radius: 16rpx;
		padding: 24rpx;
		margin-bottom: 20rpx;
		box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.03);
	}
	.card-head {
		display: flex;
		justify-content: space-between;
		margin-bottom: 16rpx;
	}
	.plate {
		font-size: 32rpx;
		font-weight: bold;
		color: #2b6cff;
	}
	.tag {
		font-size: 22rpx;
		padding: 4rpx 16rpx;
		border-radius: 20rpx;
	}
	.tag-paid { background: #f0f9eb; color: #19be6b; }
	.tag-unpaid { background: #ffefef; color: #fa3534; }

	.card-body {
		font-size: 24rpx;
		color: #606266;
		line-height: 40rpx;
		background: #fafbfc;
		padding: 16rpx;
		border-radius: 10rpx;
	}
	.label {
		color: #909399;
		margin-right: 10rpx;
	}
	.card-foot {
		display: flex;
		justify-content: space-between;
		margin-top: 16rpx;
		font-size: 22rpx;
		color: #c0c4cc;
	}
	.amount {
		font-size: 30rpx;
		font-weight: bold;
		color: #fa3534;
	}

	/* 分页器 */
	.pagination {
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 20rpx 0;
	}
	.page-btn {
		padding: 10rpx 30rpx;
		background: #fff;
		border-radius: 30rpx;
		font-size: 24rpx;
		color: #2b6cff;
		box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.05);
	}
	.page-btn.disabled {
		color: #c0c4cc;
		background: #f5f7fa;
		box-shadow: none;
	}
	.page-info {
		margin: 0 30rpx;
		font-size: 24rpx;
		color: #606266;
	}

	.empty {
		text-align: center;
		color: #909399;
		font-size: 26rpx;
		padding: 100rpx 0;
	}
</style>