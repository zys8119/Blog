class CalendarDataJs {
    constructor() {

    }

    /**
     * 判断是否为闰年
     * @param year 年份
     */
    is_leap(year) {
        return (year%100==0?(year%400==0?1:0):(year%4==0?1:0));
    }

    /**
     * 判断月份大小并返回当月天数
     * @param Month 月份
     * @param dateYear 年份
     */
    is_Month(Month,dateYear){
        dateYear = dateYear || new Date().getFullYear();
        var dateindex = 31;if(Month % 2 == 0){dateindex = 30;if(Month == 2){(this.is_leap(dateYear))?dateindex = 29:dateindex = 28;};};if(Month >= 8){(Month % 2 == 0)?dateindex = 31:dateindex = 30;};return dateindex;
    }

    /**
     *
     * @param dateA 年份
     * @param dateB 月分
     * @param dateC 日期
     */
    returnLunarDateToB(dateA,dateB,dateC){
        var initData = new Date();
        dateA = dateA || initData.getFullYear();
        dateB = dateB || initData.getMonth()+1;
        dateC = dateC || initData.getDate();
        var LunarDate = {
            madd: new Array(0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334),
            HsString: '甲乙丙丁戊己庚辛壬癸',
            EbString: '子丑寅卯辰巳午未申酉戌亥',
            NumString: "一二三四五六七八九十",
            MonString: "正二三四五六七八九十冬腊",
            CalendarData: new Array(0xA4B, 0x5164B, 0x6A5, 0x6D4, 0x415B5, 0x2B6, 0x957, 0x2092F, 0x497, 0x60C96, 0xD4A, 0xEA5, 0x50DA9, 0x5AD, 0x2B6, 0x3126E, 0x92E, 0x7192D, 0xC95, 0xD4A, 0x61B4A, 0xB55, 0x56A, 0x4155B, 0x25D, 0x92D, 0x2192B, 0xA95, 0x71695, 0x6CA, 0xB55, 0x50AB5, 0x4DA, 0xA5B, 0x30A57, 0x52B, 0x8152A, 0xE95, 0x6AA, 0x615AA, 0xAB5, 0x4B6, 0x414AE, 0xA57, 0x526, 0x31D26, 0xD95, 0x70B55, 0x56A, 0x96D, 0x5095D, 0x4AD, 0xA4D, 0x41A4D, 0xD25, 0x81AA5, 0xB54, 0xB6A, 0x612DA, 0x95B, 0x49B, 0x41497, 0xA4B, 0xA164B, 0x6A5, 0x6D4, 0x615B4, 0xAB6, 0x957, 0x5092F, 0x497, 0x64B, 0x30D4A, 0xEA5, 0x80D65, 0x5AC, 0xAB6, 0x5126D, 0x92E, 0xC96, 0x41A95, 0xD4A, 0xDA5, 0x20B55, 0x56A, 0x7155B, 0x25D, 0x92D, 0x5192B, 0xA95, 0xB4A, 0x416AA, 0xAD5, 0x90AB5, 0x4BA, 0xA5B, 0x60A57, 0x52B, 0xA93, 0x40E95),
            Year: null,
            Month: null,
            Day: null,
            TheDate: null,
            GetBit: function(m, n){
                return (m >> n) & 1;
            },
            e2c: function(){
                this.TheDate = (arguments.length != 3) ? new Date(): new Date(arguments[0], arguments[1], arguments[2]);
                var total, m, n, k;
                var isEnd = false;
                var tmp = this.TheDate.getFullYear();
                total = (tmp - 1921) * 365 + Math.floor((tmp - 1921) / 4) + this.madd[this.TheDate.getMonth()] + this.TheDate.getDate() - 38;
                if (this.TheDate.getYear() % 4 == 0 && this.TheDate.getMonth() > 1) {
                    total++;
                }
                for (m = 0; ; m++) {
                    k = (this.CalendarData[m] < 0xfff) ? 11: 12;
                    for (n = k; n >= 0; n--) {
                        if (total <= 29 + this.GetBit(this.CalendarData[m], n)) {
                            isEnd = true;
                            break;
                        }
                        total = total - 29 - this.GetBit(this.CalendarData[m], n);
                    }
                    if (isEnd)
                        break;
                }
                this.Year = 1921 + m;
                this.Month = k - n + 1;
                this.Day = total;
                if (k == 12) {
                    if (this.Month == Math.floor(this.CalendarData[m] / 0x10000) + 1) {
                        this.Month = 1 - this.Month;
                    }
                    if (this.Month > Math.floor(this.CalendarData[m] / 0x10000) + 1) {
                        this.Month--;
                    }
                }
            },
            GetcDateString: function(){
                var tmp = "";
                tmp += this.HsString.charAt((this.Year - 4) % 10);
                tmp += this.EbString.charAt((this.Year - 4) % 12);
                tmp += "年 ";
                if (this.Month < 1) {
                    tmp += "(闰)";
                    tmp += this.MonString.charAt(-this.Month - 1);
                } else {
                    tmp += this.MonString.charAt(this.Month - 1);
                }
                tmp += "月";
                tmp += (this.Day < 11) ? "初": ((this.Day < 20) ? "十": ((this.Day < 30) ? "廿": "三十"));
                if (this.Day % 10 != 0 || this.Day == 10) {
                    tmp += this.NumString.charAt((this.Day - 1) % 10);
                }
                return tmp;
            },
            GetLunarDay: function(solarYear, solarMonth, solarDay) {
                if (solarYear < 1921 || solarYear > 2020) {
                    return "";
                } else {
                    solarMonth = (parseInt(solarMonth) > 0) ? (solarMonth - 1): 11;
                    this.e2c(solarYear, solarMonth, solarDay);
                    return this.GetcDateString();
                }
            }
        };
        return LunarDate.GetLunarDay(dateA,dateB,dateC);
    }

    /**
     * 返回日历数据
     * @param dateYear 年份
     * @param dateMonth 月份
     */
    returnDate(dateYear,dateMonth){
        var initData = new Date();
        dateYear = dateYear || initData.getFullYear();
        dateMonth = dateMonth || initData.getMonth()+1;
        var dateDay = new Date(dateYear,dateMonth-1,1).getDay(),//星期
            dateindex = this.is_Month(dateMonth,dateYear),
            DayData = new Array(42),
            newDayAll = ["星期日","星期一","星期二","星期三","星期四","星期五","星期六"],
            newDayAllIndex = 0;
        for(var i = 0 ; i < DayData.length ; i++){
            if(i % 7 == 0){
                newDayAllIndex = 0;
            }else{
                newDayAllIndex ++;
            };
            DayData[i] = {
                week:newDayAllIndex,
                name:newDayAll[newDayAllIndex],
                Explain:"说明：" +
                    "==@ LunarCalendar：当天对应的农历；"+
                    "==@ dateDayIndex：该参数是指当月的1号的索引值为dateDayIndex，即"+dateDay+
                    "==@ day：当天号数；"+
                    "==@ getDayAll：当天总日期；"+
                    "==@ getDateIdex：参数为当月总天数；"+
                    "==@ getDateIdex_Lastmonth：参数为上月总天数；"+
                    "==@ getDateIdex_Nextmonth：参数为下月总天数；"+
                    "==@ name：当天星期数【文字】（星期一/星期六）；"+
                    "==@ week：当天星期数【数字】（0-6）；",
                dateDayIndex:dateDay,
                getDateIdex:this.is_Month(dateMonth,dateYear),
                getDateIdex_Lastmonth:this.is_Month(dateMonth-1,dateYear),
                getDateIdex_Nextmonth:this.is_Month(dateMonth+1,dateYear)
            };
            var returnLunarDateToB_index = 0;
            if(i >= dateDay && i < dateindex+dateDay){
                DayData[i].day = i-dateDay+1;
            }else if(i < dateDay){
                DayData[i].day = this.is_Month(dateMonth-1,dateYear)-dateDay+i+1;
                switch (dateindex){
                    case 30:
                        DayData[i].day = this.is_Month(dateMonth-1,dateYear)-dateDay+i+1;
                        break;
                    case 31:
                        DayData[i].day = this.is_Month(dateMonth,dateYear)-dateDay+i;
                        if(dateMonth == 8 || dateMonth == 3){
                            DayData[i].day = this.is_Month(dateMonth-1,dateYear)+1-dateDay+i;
                        };
                        if(dateMonth == 1){
                            DayData[i].day = this.is_Month(12,dateYear)+1-dateDay+i;
                        };
                        break;
                };
                returnLunarDateToB_index = -1;
            }else{
                DayData[i].day = i-dateindex-dateDay+1;
                returnLunarDateToB_index = 1;
            };
            DayData[i].LunarCalendar = this.returnLunarDateToB(dateYear,dateMonth+returnLunarDateToB_index,DayData[i].day);
            DayData[i].getDayAll = (function(){
                var dateMonth2 = dateMonth+returnLunarDateToB_index;
                if(dateMonth2 > 12){
                    return dateYear+1;
                }else if(dateMonth2 < 1){
                    return dateYear-1;
                }
                return dateYear;
            })()+"-"+(function(){
                var dateMonth2 = dateMonth+returnLunarDateToB_index;
                if(dateMonth2 > 12){
                    return 1;
                }else if(dateMonth2 < 1){
                    return 12;
                }
                return dateMonth2;
            })()+"-"+DayData[i].day;
        };
        return DayData;
    }
}


const d = new CalendarDataJs();
// const  res = d.returnDate(2022,1)
// const  res2 = d.is_Month(1,2022)
// const  res3 = d.is_leap(2022)
const  res4 = d.returnLunarDateToB(2022,1,1)
console.log(res4)
