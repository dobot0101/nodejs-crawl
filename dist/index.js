var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// import { join, dirname } from 'path';
import axios from 'axios';
import * as cheerio from 'cheerio';
import iconv from 'iconv-lite';
import { Low, JSONFile } from 'lowdb';
// import { fileURLToPath } from 'url';
// const __dirname = dirname(fileURLToPath(import.meta.url));
// Use JSON file for storage
// const file = join(__dirname, 'db.json');
const file = './db.json';
const adapter = new JSONFile(file);
const db = new Low(adapter);
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const html = yield getHtml();
        if (html && html.data) {
            // 네이버 뉴스 페이지의 경우 한글이 깨져서 아래와 같이 iconv 사용
            const decodedStr = iconv.decode(html.data, 'euc-kr');
            // const $ = cheerio.load(iconv.decode(html.data, 'euc-kr').toString());
            const $ = cheerio.load(decodedStr);
            const articleList = $('ul.newsList').children('li.block1');
            const articles = [];
            articleList.each((i, el) => {
                let title = '';
                if ($(el).find('dd.articleSubject').length > 0) {
                    title = $(el).find('dd.articleSubject > a').text().trim();
                }
                else if ($(el).find('dt.articleSubject').length > 0) {
                    title = $(el).find('dt.articleSubject > a').text().trim();
                }
                // const contents = $(el).find('dd.articleSummary').contents();
                // console.log(contents);
                articles.push({
                    title,
                    body: $(el)
                        .find('dd.articleSummary')
                        .contents()
                        .filter(function () {
                        return this.type === 'text';
                    })
                        .text()
                        .trim(),
                    company: $(el).find('dd.articleSummary > span.press').text().trim(),
                    writeDate: $(el).find('dd.articleSummary > span.wdate').text().trim(),
                });
            });
            // console.log(articles);
            yield db.read();
            // console.log(result);
            db.data = db.data || { articles: [] };
            db.data.articles = articles;
            yield db.write();
            const result = db.data.articles.filter(article => article.company === '아시아경제');
            db.data.articles = result;
            yield db.write();
        }
    });
}
main();
function getHtml() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            return yield axios.get('https://finance.naver.com/news/mainnews.naver', {
                responseType: 'arraybuffer',
                responseEncoding: 'binary',
            });
        }
        catch (error) {
            console.error(error);
        }
    });
}
