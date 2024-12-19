#!/bin/bash

# 设置变量
PROJECT_ROOT="/opt/valueInvestCoin/ValueInvestAdmin"  # 项目根目录
BUILD_DIR="$PROJECT_ROOT/dist"                 # 构建后的目录
LOG_FILE="$PROJECT_ROOT/vue_autobot.log"       # 日志文件
PID_FILE="$PROJECT_ROOT/vue_autobot.pid"       # PID 文件
PORT=28888                                      # 运行端口

# 日志函数
log_message() {
    echo "$(date "+%Y-%m-%d %H:%M:%S") - $1" >> "$LOG_FILE"
}

# 启动服务
start() {
    if [ -f "$PID_FILE" ] && kill -0 $(cat "$PID_FILE") 2>/dev/null; then
        log_message "服务正在运行，跳过启动。"
        echo "服务已经在运行，PID: $(cat $PID_FILE)"
        exit 1
    fi

    log_message "安装依赖..."
    cd "$PROJECT_ROOT" || exit
    npm install >> "$LOG_FILE" 2>&1

    log_message "构建 Vue 项目..."
    npm run build >> "$LOG_FILE" 2>&1

    log_message "启动服务..."
    nohup npx serve -s "$BUILD_DIR" -l $PORT >> "$LOG_FILE" 2>&1 &
    echo $! > "$PID_FILE"
    log_message "服务已启动，PID: $(cat $PID_FILE)"
    echo "服务已启动，PID: $(cat $PID_FILE)"
}

# 停止服务
stop() {
    if [ ! -f "$PID_FILE" ] || ! kill -0 $(cat "$PID_FILE") 2>/dev/null; then
        log_message "服务未运行，跳过停止。"
        echo "服务未运行，无法停止。"
        exit 1
    fi

    log_message "停止服务..."
    kill "$(cat $PID_FILE)" && rm -f "$PID_FILE"
    log_message "服务已停止。"
    echo "服务已停止。"
}

# 重启服务
restart() {
    log_message "重启服务..."
    stop
    start
}

# 显示用法
usage() {
    echo "用法: $0 {start|stop|restart}"
    exit 1
}

# 处理输入的命令
case "$1" in
    start)
        start
        ;;
    stop)
        stop
        ;;
    restart)
        restart
        ;;
    *)
        usage
        ;;
esac