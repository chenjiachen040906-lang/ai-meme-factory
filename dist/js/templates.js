// 表情包模板数据库
const MEME_TEMPLATES = [
    // 开心/兴奋
    { id: 1, name: '得意', emoji: '😎', category: 'happy', keywords: ['得意', '酷', '厉害', '成功', '赢了', '牛', '强', '优秀', '满分', '通过'] },
    { id: 2, name: '开心', emoji: '', category: 'happy', keywords: ['开心', '高兴', '快乐', '爽', '棒', '好', 'yes', '太好了', '完美'] },
    { id: 3, name: '庆祝', emoji: '🎉', category: 'happy', keywords: ['庆祝', '恭喜', '胜利', '毕业', '放假', '周末', '过节', '生日'] },
    { id: 4, name: '爱心', emoji: '🥰', category: 'happy', keywords: ['爱', '喜欢', '心动', '甜', '幸福', '温暖', '感动', '谢谢'] },
    { id: 5, name: '期待', emoji: '🤩', category: 'happy', keywords: ['期待', '想要', '渴望', '羡慕', '好想要', '种草'] },
    { id: 6, name: '加油', emoji: '💪', category: 'happy', keywords: ['加油', '努力', '坚持', '奋斗', '拼搏', '冲', 'fighting'] },
    { id: 7, name: '点赞', emoji: '👍', category: 'happy', keywords: ['赞', '好样的', '厉害', '佩服', 'respect', 'respect'] },
    { id: 8, name: '撒花', emoji: '', category: 'happy', keywords: ['撒花', '美好', '春天', '浪漫', '温柔'] },

    // 难过/沮丧
    { id: 9, name: '难过', emoji: '😢', category: 'sad', keywords: ['难过', '伤心', '哭', '悲伤', '委屈', '心疼', '心疼'] },
    { id: 10, name: '失望', emoji: '😞', category: 'sad', keywords: ['失望', '遗憾', '可惜', '没希望', '凉了', '完了'] },
    { id: 11, name: '疲惫', emoji: '😩', category: 'sad', keywords: ['累', '疲惫', '辛苦', '加班', '熬夜', '困', '睡不够', '起不来'] },
    { id: 12, name: '孤独', emoji: '🥺', category: 'sad', keywords: ['孤独', '寂寞', '一个人', '没人陪', '单身', '可怜'] },
    { id: 13, name: '心碎', emoji: '💔', category: 'sad', keywords: ['心碎', '分手', '失恋', '被拒', '拒绝', '扎心'] },
    { id: 14, name: '叹气', emoji: '😮‍💨', category: 'sad', keywords: ['叹气', '无奈', '没办法', '算了', '无所谓', '随便'] },
    { id: 15, name: 'emo', emoji: '🌧️', category: 'sad', keywords: ['emo', '抑郁', '低落', '不开心', '心情不好', '烦'] },
    { id: 16, name: '破防', emoji: '😭', category: 'sad', keywords: ['破防', '崩溃', '受不了', '受不了了', '太难了'] },

    // 生气/不满
    { id: 17, name: '生气', emoji: '😡', category: 'angry', keywords: ['生气', '愤怒', '气死', '恼火', '烦死了', '受不了'] },
    { id: 18, name: '翻白眼', emoji: '🙄', category: 'angry', keywords: ['翻白眼', '无语', '呵呵', '就这', '不过如此', '一般般'] },
    { id: 19, name: '鄙视', emoji: '👎', category: 'angry', keywords: ['鄙视', '差评', '不行', '垃圾', '烂', '差劲'] },
    { id: 20, name: '拳头', emoji: '', category: 'angry', keywords: ['拳头', '打你', '揍', '不服', '来啊', '刚'] },
    { id: 21, name: '炸弹', emoji: '💣', category: 'angry', keywords: ['爆炸', '炸了', '爆', '怒', '暴躁', '炸毛'] },
    { id: 22, name: '冷笑', emoji: '😏', category: 'angry', keywords: ['冷笑', '呵呵', '有趣', '有意思', '你猜', '你品'] },

    // 搞笑/沙雕
    { id: 23, name: '狗头', emoji: '🐶', category: 'funny', keywords: ['狗头', '保命', '开玩笑', '认真', 'doge'] },
    { id: 24, name: '笑哭', emoji: '😂', category: 'funny', keywords: ['笑哭', '哈哈哈', '笑死', '太好笑了', 'hhh', 'xswl'] },
    { id: 25, name: '滑稽', emoji: '🤪', category: 'funny', keywords: ['滑稽', '沙雕', '搞笑', '逗', '皮', '调皮'] },
    { id: 26, name: '吃瓜', emoji: '🍉', category: 'funny', keywords: ['吃瓜', '围观', '八卦', '看戏', '前排', '吃瓜群众'] },
    { id: 27, name: '震惊', emoji: '😱', category: 'funny', keywords: ['震惊', '震惊了', '什么', '不会吧', '真的假的', '离谱'] },
    { id: 28, name: '思考', emoji: '🤔', category: 'funny', keywords: ['思考', '想', '嗯', '有道理', '确实', '等等'] },
    { id: 29, name: '躺平', emoji: '🛋️', category: 'funny', keywords: ['躺平', '摆烂', '算了', '不干了', '放弃', '咸鱼', '摸鱼'] },
    { id: 30, name: '干饭', emoji: '🍚', category: 'funny', keywords: ['干饭', '吃', '饿', '饭', '美食', '饿死了', '干饭人'] },
    { id: 31, name: '摸鱼', emoji: '🐟', category: 'funny', keywords: ['摸鱼', '划水', '偷懒', '上班', '工作', '打工'] },
    { id: 32, name: '打工人', emoji: '👷', category: 'funny', keywords: ['打工人', '上班', '工作', '加班', '工资', '老板', '打工'] },
    { id: 33, name: '考试', emoji: '📝', category: 'funny', keywords: ['考试', '作业', '学习', '挂科', '复习', '预习', 'ddl', 'deadline'] },
    { id: 34, name: '熬夜', emoji: '🦉', category: 'funny', keywords: ['熬夜', '凌晨', '半夜', '失眠', '夜猫子', '修仙'] },
    { id: 35, name: '催婚', emoji: '💍', category: 'funny', keywords: ['催婚', '相亲', '对象', '恋爱', '结婚', '单身狗'] },
    { id: 36, name: '月光', emoji: '', category: 'funny', keywords: ['月光', '没钱', '穷', '花呗', '信用卡', '花钱', '买买买'] },
    { id: 37, name: '内卷', emoji: '🌀', category: 'funny', keywords: ['内卷', '卷', '竞争', '压力', '焦虑', '比较'] },
    { id: 38, name: '社恐', emoji: '🫣', category: 'funny', keywords: ['社恐', '社死', '尴尬', '害羞', '不敢', '害怕社交'] },
    { id: 39, name: '摆烂', emoji: '🗑️', category: 'funny', keywords: ['摆烂', '放弃', '不管了', '随便吧', '爱咋咋地'] },
    { id: 40, name: '真香', emoji: '😋', category: 'funny', keywords: ['真香', '打脸', '口嫌体正直', '还是香', '逃不过'] },
];

// 随机灵感文案
const RANDOM_INSPIRATIONS = [
    '考试前一夜还在刷手机的我',
    '当代码一次就跑通了',
    '周一早上的我 vs 周五下午的我',
    '妈妈说再玩手机就把手机收了',
    '干饭不积极，思想有问题',
    'DDL是第一生产力',
    '又双叒叕被催婚了',
    '工资刚发就还了花呗',
    '说好早睡结果凌晨三点还在刷视频',
    '别人家的孩子 vs 我',
    '健身卡办了等于健身了',
    '收藏了等于学过了',
    '今天也是元气满满（并不）的一天',
    '我的钱不是花掉了，是换了一种方式陪我',
    '不是我不努力，是床先动的手',
    '甲方：这个很简单，随便改改就行',
    '论文写不出来但表情包可以',
    '期末复习：从入门到放弃',
    '我的存款：三位数，我的欲望：六位数',
    '上班摸鱼被抓的瞬间',
];

// 场景到情绪的映射
const SCENE_EMOTION_MAP = {
    happy: ['开心', '高兴', '快乐', '爽', '棒', '好', '成功', '赢', '通过', '完美', '太', '棒', '赞', '厉害', '牛', '强', '优秀', '庆祝', '恭喜', '毕业', '放假', '周末', '爱', '喜欢', '幸福', '温暖', '感动', '加油', '努力', '冲', '期待', '想要', '羡慕'],
    sad: ['难过', '伤心', '哭', '累', '疲惫', '辛苦', '加班', '熬夜', '困', '孤独', '寂寞', '一个人', '心碎', '分手', 'emo', '抑郁', '低落', '烦', '破防', '崩溃', '太难', '失望', '遗憾', '凉', '完了', '无奈', '委屈'],
    angry: ['生气', '愤怒', '气', '恼火', '烦死', '无语', '呵呵', '鄙视', '不行', '垃圾', '烂', '差劲', '爆炸', '炸', '怒', '暴躁', '不服', '刚'],
    funny: ['哈哈', '笑', '滑稽', '沙雕', '搞笑', '吃瓜', '震惊', '离谱', '狗头', '躺平', '摆烂', '摸鱼', '干饭', '打工人', '考试', '催婚', '月光', '内卷', '社恐', '真香', '咸鱼', '打工', '上班', '工资', '老板', 'ddl', 'deadline', '卷', '压力']
};
