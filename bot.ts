// 导入TS库
import {Contact, Message, Wechaty} from 'wechaty'
import {MessageType, ScanStatus} from 'wechaty-puppet'
import {PuppetPadplus} from 'wechaty-puppet-padplus'
import QrcodeTerminal from 'qrcode-terminal'
// 导入JS库
const fs = require("fs");
let log4js = require('log4js');
// 初始化日志库
log4js.configure({
    appenders: {
        production: {
            type: 'dateFile',
            filename: 'log.txt'
        }
    },
    categories: {
        default: { appenders: [ 'production' ], level: 'debug' }
    }
});
let logger = log4js.getLogger();
// 固定参数
const token = '';
const name  = 'rcbot';
// 读取json文件，解析成映射字典
let maps = JSON.parse(fs.readFileSync('20200719.json','utf-8'));
logger.info(`解析JSON文件完成，映射数量：${Object.keys(maps).length}`);
// 创建机器人实例
const puppet = new PuppetPadplus({token, });
// generate xxxx.memory-card.json and save login data for the next login
const bot = new Wechaty({puppet, name, });
// 功能函数-休眠
function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
// 登录消息处理函数
function onlogin(user: Contact){
    logger.info(`用户：${user.name()}登陆成功`);
}
// 登出事件处理函数
function onlogout(user: Contact, reason: string){
    logger.info(`用户：${user.name()}登出成功，登出原因：${reason}`);
}
// 接收消息处理函数
async function onmessage(msg: Message) {
    // 如果是自己发出去的消息，直接返回
    if (msg.self())
        return 0;
    // 如果收到别人发来的消息
    const room = msg.room();
    const from = msg.from();
    const to = msg.to();
    // 记录日志
    if(room){   // 如果是群消息
        const topic = await room.topic();   // 获取群名称
        logger.info(`在群${topic}中，收到由${from?.name()}发来的消息：${msg.text()}`);
    } else if (to){    // 如果不是群消息
        logger.info(`私聊消息，收到由${from?.name()}发来的消息：${msg.text()}`);
    }
    // 判断消息类型
    if(msg.type() === Message.Type.Text){   // 如果是文字消息
        let msgu = msg.text().toUpperCase();
        let keyhit = '';
        for (let key in maps) {
            if (maps.hasOwnProperty(key)) {
                if (msgu.includes(key)) {   // 如果匹配到key
                    // 如果该key以S或者D开头，且包含BF，则代表匹配上，则比较长度
                    if (((key[0] === 'B') || (!msgu.includes(`BF${key}`))) && (keyhit.length < key.length))
                        keyhit = key;
                }
            }
        }
        if(keyhit !== ''){
            await sleep(1000);   // 休眠1S
            logger.info(`回复消息：${maps[keyhit]}`);
            await msg.say(maps[keyhit]);   // 回复消息
        }
    } 
}
// 注册处理函数
// 扫描消息处理函数直接内置处理，因为存在类型指定问题
bot.on('scan', (qrcode, status) => {
    if (status === ScanStatus.Waiting) {
        QrcodeTerminal.generate(qrcode, {
            small: true
        })
    }
}).on('login', onlogin).on('message', onmessage).on('logout', onlogout).start();
