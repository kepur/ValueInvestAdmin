import dayjs from 'dayjs';
// 导入 dayjs 插件
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

// 添加 dayjs 插件
dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * 格式化日期为指定时区并返回日期字符串（支持多种日期格式）
 * @param {Date|string} date - 输入的 Date 对象或者日期字符串
 * @param {string} timezoneString - 时区，例如 "Asia/Shanghai"
 * @param {string} format - 日期格式，例如 "YYYY-MM-DD" 或 "YYYY-MM-DD HH:mm:ss"
 * @returns {string} - 返回格式化后的日期字符串
 */
interface FormatDateToTimezoneParams {
    date: Date | string;
    timezoneString?: string;
    format?: string;
}

function formatDateToTimezone({
    date,
    timezoneString = 'Asia/Shanghai',
    // format = 'YYYY-MM-DD'
    format = 'YYYY-MM-DD HH:mm:ss' // 默认格式改为包含时分秒
}: FormatDateToTimezoneParams): string {
    // 判断传入的日期类型
    let dayjsDate;
    if (date instanceof Date) {
        if (isNaN(date.getTime())) {
            throw new Error('传入的参数必须是有效的 Date 类型');
        }
        dayjsDate = dayjs(date); // 直接转换为 dayjs 对象
    } else if (typeof date === 'string') {
        dayjsDate = dayjs(date); // 尝试将字符串转换为 dayjs 对象
        if (!dayjsDate.isValid()) {
            throw new Error('传入的字符串日期无效');
        }
    } else {
        throw new Error('传入的日期类型不正确');
    }

    // 使用 dayjs 格式化日期并转换为指定时区
    const formattedDateStr = dayjsDate
        .tz(timezoneString) // 转换为指定时区
        .format(format); // 根据传入的格式化

    // 返回格式化后的日期字符串
    console.log('formattedDateStr:', formattedDateStr);
    return formattedDateStr;
}

// 导出函数
export { formatDateToTimezone };
