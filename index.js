// ES6 or TypeScript:
import * as cheerio from 'cheerio';
import axios from 'axios';
import iconv from 'iconv-lite';
import { Low, JSONFile } from 'lowdb';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Use JSON file for storage
const file = join(__dirname, 'db.json');

const adapter = new JSONFile(file);
const db = new Low(adapter);

getHtml().then(html => {
  if (html && html.data) {
    // 네이버 뉴스 페이지의 경우 한글이 깨져서 아래와 같이 iconv 사용
    // iconv.decode(html.data, 'euc-kr').toString();
    const $ = cheerio.load(iconv.decode(html.data, 'euc-kr').toString());
    const articleList = $('ul.newsList').children('li.block1');
    // const articles: { title: string; body: string; company: string; writeDate: string }[] = [];
    const articles = [];

    articleList.each(function (i, el) {
      let title = '';
      if ($(this).find('dd.articleSubject').length > 0) {
        title = $(this).find('dd.articleSubject > a').text().trim();
      } else if ($(this).find('dt.articleSubject').length > 0) {
        title = $(this).find('dt.articleSubject > a').text().trim();
      }

      articles.push({
        title,
        body: $(this)
          .find('dd.articleSummary')
          .contents()
          .filter(function () {
            return this.type === 'text';
          })
          .text()
          .trim(),
        company: $(this).find('dd.articleSummary > span.press').text().trim(),
        writeDate: $(this).find('dd.articleSummary > span.wdate').text().trim(),
      });
    });

    db.read().then(() => {
      db.data = db.data || { articles: [] };
      if (!db.data.articles) {
        db.data.articles = [];
      }

      db.data.articles.push(...articles);
      db.write().then(() => {
        console.log(`db write completed.`);
        const { title, body, company, writeDate } = db.data.articles[0];
        console.log(title, body, company, writeDate);
      });
    });
  }
});

async function getHtml() {
  try {
    return await axios.get('https://finance.naver.com/news/mainnews.naver', {
      responseType: 'arraybuffer',
      responseEncoding: 'binary',
    });
  } catch (error) {
    console.error(error);
  }
}
