# 阿里云服务器 SSH 连接

## 服务器信息

| 项目 | 值 |
|------|-----|
| IP | 120.77.36.107 |
| 用户 | admin |
| 端口 | 22 (默认) |
| 密钥 | ~/.ssh/id_ed25519 |

## 连接命令

```bash
ssh -i ~/.ssh/id_ed25519 admin@120.77.36.107
```

## 免密登录配置

本地公钥已添加到服务器 `~/.ssh/authorized_keys`：

```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIHqMQPqXJpR5B6AzlDCuVunSSLOA1gQPkAFv5jBGDkA7 wangjianjun
```

如需重新添加（在服务器上执行）：

```bash
mkdir -p ~/.ssh && chmod 700 ~/.ssh
echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIHqMQPqXJpR5B6AzlDCuVunSSLOA1gQPkAFv5jBGDkA7 wangjianjun" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

## 常用命令

```bash
# 查看系统状态
uname -a && uptime && df -h /

# 查看 PM2 进程
sudo pm2 list

# 查看 Nginx 状态
sudo systemctl status nginx

# 查看 MySQL 状态
sudo systemctl status mysql

# 查看日志
sudo pm2 logs
sudo tail -f /var/log/nginx/error.log
```
