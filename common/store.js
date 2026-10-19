/**
 * 停车管理信息系统 - 数据层
 * 使用 uni.setStorageSync 模拟后端数据库，可无缝替换为 uni.request 调用真实 API
 */

const DB_KEY = 'PARKING_DB_V1'

/* ---------------- 工具函数 ---------------- */
function pad(n, len = 2) {
	return String(n).padStart(len, '0')
}

export function formatTime(ts) {
	const d = new Date(ts)
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
		`${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

export function parseTime(str) {
	if (!str) return 0
	return new Date(String(str).replace(/-/g, '/')).getTime()
}

export function fmtDuration(minutes) {
	if (!minutes || minutes <= 0) return '0分钟'
	if (minutes < 60) return `${minutes}分钟`
	const h = Math.floor(minutes / 60)
	const m = minutes % 60
	return m > 0 ? `${h}小时${m}分钟` : `${h}小时`
}

/* ---------------- 初始数据 ---------------- */
function genSeats() {
	const seats = []
	for (let i = 1; i <= 60; i++) {
		seats.push({
			id: i,
			seatNo: 'A' + pad(i, 3),
			seatType: i % 10 === 0 ? 2 : 1, // 1小车位 2大车位
			status: 0 // 0空闲 1占用
		})
	}
	return seats
}

function defaultDB() {
	const now = Date.now()
	const seats = genSeats()
	seats[0].status = 1
	seats[1].status = 1

	const vehicles = [
		{ id: 1, plateNumber: '陕A88888', carColor: '白色', carType: 2, owner: '张三', phone: '13800000001', createTime: formatTime(now - 30 * 86400000) },
		{ id: 2, plateNumber: '陕B66666', carColor: '黑色', carType: 1, owner: '李四', phone: '13800000002', createTime: formatTime(now - 20 * 86400000) },
		{ id: 3, plateNumber: '陕C12345', carColor: '蓝色', carType: 1, owner: '王五', phone: '13800000003', createTime: formatTime(now - 10 * 86400000) }
	]

	const records = [
		{
			id: 1, plateNumber: '陕A88888', seatNo: 'A001',
			enterTime: formatTime(now - 2 * 3600000), exitTime: '',
			minutes: 0, price: 0, payMoney: 0, orderNo: '',
			isPay: 0, bstate: 0, carType: 2
		},
		{
			id: 2, plateNumber: '陕B66666', seatNo: 'A002',
			enterTime: formatTime(now - 45 * 60000), exitTime: '',
			minutes: 0, price: 0, payMoney: 0, orderNo: '',
			isPay: 0, bstate: 0, carType: 1
		},
		{
			id: 3, plateNumber: '陕C12345', seatNo: 'A003',
			enterTime: formatTime(now - 26 * 3600000), exitTime: formatTime(now - 24 * 3600000),
			minutes: 120, price: 10.00, payMoney: 10.00, orderNo: 'P' + (now - 24 * 3600000),
			isPay: 1, bstate: 1, carType: 1
		},
		{
			id: 4, plateNumber: '陕B66666', seatNo: 'A005',
			enterTime: formatTime(now - 50 * 3600000), exitTime: formatTime(now - 46 * 3600000),
			minutes: 240, price: 20.00, payMoney: 20.00, orderNo: 'P' + (now - 46 * 3600000),
			isPay: 1, bstate: 1, carType: 1
		}
	]

	return {
		vehicles,
		records,
		seats,
		rule: {
			freeMinutes: 15,  // 免费时长(分钟)
			dayRate: 5,       // 白天费率(元/小时)
			nightRate: 3,     // 夜间费率(元/小时)
			dayStart: 8,      // 白天开始时间
			dayEnd: 20,       // 白天结束时间
			dayCap: 40        // 24小时封顶金额
		},
		seq: { vehicle: 3, record: 4 }
	}
}

/* ---------------- 数据库读写 ---------------- */
let _db = null

function getDB() {
	if (_db) return _db
	try {
		const s = uni.getStorageSync(DB_KEY)
		if (s) {
			const parsed = typeof s === 'string' ? JSON.parse(s) : s
			if (parsed && parsed.seats && parsed.seats.length) {
				_db = parsed
				return _db
			}
		}
	} catch (e) {
		console.warn('读取本地数据失败，使用默认数据', e)
	}
	_db = defaultDB()
	saveDB()
	return _db
}

function saveDB() {
	try {
		uni.setStorageSync(DB_KEY, JSON.stringify(_db))
	} catch (e) {
		console.error('保存数据失败', e)
	}
}

export function resetDB() {
	_db = defaultDB()
	saveDB()
	return true
}

/* ---------------- 计费引擎 ---------------- */
/**
 * 分时段计费 + 每24小时封顶
 * @param {Number} enterTs 入场时间戳
 * @param {Number} exitTs  出场时间戳
 * @param {Number} carType 1-临时车 2-月租车
 * @param {Object} rule    计费规则
 */
export function calcFee(enterTs, exitTs, carType, rule) {
	const totalMin = Math.max(0, Math.floor((exitTs - enterTs) / 60000))

	if (carType === 2) {
		return { minutes: totalMin, fee: 0, rawFee: 0, capped: false, detail: '月租车免费通行', segments: [] }
	}

	if (totalMin <= rule.freeMinutes) {
		return {
			minutes: totalMin, fee: 0, rawFee: 0, capped: false,
			detail: `停车 ${totalMin} 分钟，处于 ${rule.freeMinutes} 分钟免费时段内`,
			segments: []
		}
	}

	let fee = 0
	const segments = []
	let cursor = enterTs + rule.freeMinutes * 60000
	const step = 30 * 60000
	let guard = 0

	while (cursor < exitTs && guard < 3000) {
		const next = Math.min(cursor + step, exitTs)
		const h = new Date(cursor).getHours()
		const isDay = h >= rule.dayStart && h < rule.dayEnd
		const rate = isDay ? rule.dayRate : rule.nightRate
		const add = rate * 0.5
		fee += add
		segments.push({
			time: `${pad(new Date(cursor).getHours())}:${pad(new Date(cursor).getMinutes())}`,
			period: isDay ? '白天' : '夜间',
			rate,
			add: Number(add.toFixed(2))
		})
		cursor = next
		guard++
	}

	const rawFee = Number(fee.toFixed(2))
	const days = Math.max(1, Math.ceil((exitTs - enterTs) / 86400000))
	const cap = days * rule.dayCap
	let capped = false
	if (fee > cap) {
		fee = cap
		capped = true
	}

	return {
		minutes: totalMin,
		fee: Number(fee.toFixed(2)),
		rawFee,
		capped,
		detail: `共 ${segments.length} 个计费段${capped ? '，已触发封顶' : ''}`,
		segments
	}
}

/* ---------------- 车位 ---------------- */
export function getSeats() {
	return getDB().seats
}

export function getStats() {
	const db = getDB()
	const total = db.seats.length
	const used = db.seats.filter(s => s.status === 1).length
	const free = total - used
	return { total, used, free, rate: total ? Math.round(used / total * 100) : 0 }
}

/* ---------------- 车辆入场登记 ---------------- */
export function entry({ plateNumber, carType = 1, owner = '', phone = '', carColor = '' }) {
	const db = getDB()
	const plate = String(plateNumber || '').trim().toUpperCase()

	if (!plate) return { ok: false, msg: '请输入车牌号' }
	if (plate.length < 6) return { ok: false, msg: '车牌号格式不正确' }

	// 重复入场检测
	const exist = db.records.find(r => r.plateNumber === plate && r.bstate === 0)
	if (exist) return { ok: false, msg: '该车辆已在场内，请勿重复入场' }

	// 车位分配
	const seat = db.seats.find(s => s.status === 0)
	if (!seat) return { ok: false, msg: '车位已满，无法入场' }

	seat.status = 1
	const now = Date.now()
	const rec = {
		id: ++db.seq.record,
		plateNumber: plate,
		seatNo: seat.seatNo,
		enterTime: formatTime(now),
		exitTime: '',
		minutes: 0,
		price: 0,
		payMoney: 0,
		orderNo: '',
		isPay: 0,
		bstate: 0,
		carType
	}
	db.records.unshift(rec)

	// 车辆建档
	let v = db.vehicles.find(x => x.plateNumber === plate)
	if (!v) {
		v = {
			id: ++db.seq.vehicle,
			plateNumber: plate,
			carColor: carColor || '未知',
			carType,
			owner: owner || '临时车主',
			phone: phone || '',
			createTime: formatTime(now)
		}
		db.vehicles.push(v)
	} else {
		v.carType = carType
	}

	saveDB()
	return { ok: true, msg: '入场成功', record: rec, seatNo: seat.seatNo }
}

/* ---------------- 出场计费 ---------------- */
export function queryBill(plateNumber) {
	const db = getDB()
	const plate = String(plateNumber || '').trim().toUpperCase()
	if (!plate) return { ok: false, msg: '请输入车牌号' }

	const rec = db.records.find(r => r.plateNumber === plate && r.bstate === 0)
	if (!rec) return { ok: false, msg: '未查询到该车辆的在场记录' }

	const enterTs = parseTime(rec.enterTime)
	const exitTs = Date.now()
	const res = calcFee(enterTs, exitTs, rec.carType, db.rule)

	return {
		ok: true,
		recordId: rec.id,
		plateNumber: rec.plateNumber,
		seatNo: rec.seatNo,
		carType: rec.carType,
		enterTime: rec.enterTime,
		exitTime: formatTime(exitTs),
		minutes: res.minutes,
		duration: fmtDuration(res.minutes),
		price: res.fee,
		rawFee: res.rawFee,
		capped: res.capped,
		detail: res.detail,
		segments: res.segments,
		orderNo: 'P' + exitTs
	}
}

export function payBill(recordId) {
	const db = getDB()
	const rec = db.records.find(r => r.id === recordId)
	if (!rec) return { ok: false, msg: '账单不存在' }
	if (rec.bstate === 1) return { ok: false, msg: '该账单已结算' }

	const enterTs = parseTime(rec.enterTime)
	const exitTs = Date.now()
	const res = calcFee(enterTs, exitTs, rec.carType, db.rule)

	rec.exitTime = formatTime(exitTs)
	rec.minutes = res.minutes
	rec.price = res.fee
	rec.payMoney = res.fee
	rec.isPay = 1
	rec.bstate = 1
	rec.orderNo = 'P' + exitTs

	const seat = db.seats.find(s => s.seatNo === rec.seatNo)
	if (seat) seat.status = 0

	saveDB()
	return { ok: true, record: rec }
}

/* ---------------- 记录查询 ---------------- */
export function getRecords({ plateNumber = '', status = '', startDate = '', endDate = '' } = {}) {
	const db = getDB()
	const kw = String(plateNumber || '').trim().toUpperCase()

	return db.records.filter(r => {
		if (kw && r.plateNumber.indexOf(kw) === -1) return false
		if (status === 'in' && r.bstate !== 0) return false
		if (status === 'out' && r.bstate !== 1) return false
		if (startDate && r.enterTime.slice(0, 10) < startDate) return false
		if (endDate && r.enterTime.slice(0, 10) > endDate) return false
		return true
	})
}

export function getInParkRecords() {
	return getDB().records.filter(r => r.bstate === 0)
}

/* ---------------- 车辆管理 ---------------- */
export function getVehicles(keyword = '') {
	const db = getDB()
	const kw = String(keyword || '').trim().toUpperCase()
	if (!kw) return db.vehicles
	return db.vehicles.filter(v =>
		v.plateNumber.indexOf(kw) > -1 || String(v.owner).indexOf(keyword) > -1
	)
}

export function addVehicle(v) {
	const db = getDB()
	const plate = String(v.plateNumber || '').trim().toUpperCase()
	if (!plate) return { ok: false, msg: '请输入车牌号' }
	if (db.vehicles.some(x => x.plateNumber === plate)) return { ok: false, msg: '该车牌已存在' }

	const item = {
		id: ++db.seq.vehicle,
		plateNumber: plate,
		carColor: v.carColor || '未知',
		carType: Number(v.carType) || 1,
		owner: v.owner || '',
		phone: v.phone || '',
		createTime: formatTime(Date.now())
	}
	db.vehicles.push(item)
	saveDB()
	return { ok: true, msg: '新增成功', data: item }
}

export function updateVehicle(v) {
	const db = getDB()
	const item = db.vehicles.find(x => x.id === v.id)
	if (!item) return { ok: false, msg: '车辆不存在' }
	item.plateNumber = String(v.plateNumber || '').trim().toUpperCase()
	item.carColor = v.carColor || '未知'
	item.carType = Number(v.carType) || 1
	item.owner = v.owner || ''
	item.phone = v.phone || ''
	saveDB()
	return { ok: true, msg: '修改成功' }
}

export function deleteVehicle(id) {
	const db = getDB()
	const idx = db.vehicles.findIndex(x => x.id === id)
	if (idx === -1) return { ok: false, msg: '车辆不存在' }
	const plate = db.vehicles[idx].plateNumber
	if (db.records.some(r => r.plateNumber === plate && r.bstate === 0)) {
		return { ok: false, msg: '该车辆当前在场，无法删除' }
	}
	db.vehicles.splice(idx, 1)
	saveDB()
	return { ok: true, msg: '删除成功' }
}

/* ---------------- 计费规则 ---------------- */
export function getRule() {
	return getDB().rule
}

export function saveRule(rule) {
	const db = getDB()
	db.rule = {
		freeMinutes: Number(rule.freeMinutes) || 0,
		dayRate: Number(rule.dayRate) || 0,
		nightRate: Number(rule.nightRate) || 0,
		dayStart: Number(rule.dayStart) || 0,
		dayEnd: Number(rule.dayEnd) || 24,
		dayCap: Number(rule.dayCap) || 0
	}
	saveDB()
	return { ok: true, msg: '规则已保存' }
}

/* ---------------- 运营统计 ---------------- */
export function getTodayStats() {
	const db = getDB()
	const today = formatTime(Date.now()).slice(0, 10)
	const todayRecords = db.records.filter(r => r.enterTime.slice(0, 10) === today)
	const income = db.records
		.filter(r => r.isPay === 1 && r.exitTime && r.exitTime.slice(0, 10) === today)
		.reduce((s, r) => s + (r.payMoney || 0), 0)
	return { count: todayRecords.length, income: Number(income.toFixed(2)) }
}