// import { join, dirname } from 'path';
import axios from 'axios';
import * as cheerio from 'cheerio';
import iconv from 'iconv-lite';
import { Low, JSONFile } from 'lowdb';
// import { fileURLToPath } from 'url';

// const __dirname = dirname(fileURLToPath(import.meta.url));

// Use JSON file for storage
// const file = join(__dirname, 'db.json');

type Data = {
  articles: Articles; // Expect posts to be an array of strings
};

type Articles = { title: string; body: string; company: string; writeDate: string }[];

const file = './db.json';
const adapter = new JSONFile<Data>(file);
const db = new Low<Data>(adapter);

async function main() {
  const html = await getHtml();
  if (html && html.data) {
    // 네이버 뉴스 페이지의 경우 한글이 깨져서 아래와 같이 iconv 사용
    const decodedStr = iconv.decode(html.data, 'euc-kr');
    // const $ = cheerio.load(iconv.decode(html.data, 'euc-kr').toString());
    const $ = cheerio.load(decodedStr);
    const articleList = $('ul.newsList').children('li.block1');
    const articles: Articles = [];

    articleList.each((i: any, el: any) => {
      let title = '';
      if ($(el).find('dd.articleSubject').length > 0) {
        title = $(el).find('dd.articleSubject > a').text().trim();
      } else if ($(el).find('dt.articleSubject').length > 0) {
        title = $(el).find('dt.articleSubject > a').text().trim();
      }

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

    await db.read();

    db.data = db.data || { articles: [] };
    db.data.articles = articles;

    await db.write();

    // const result = db.data.articles.filter(article => article.company === '아시아경제');
    // db.data.articles = result;
    // await db.write();
  }
}

main();

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
