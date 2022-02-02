// ES6 or TypeScript:
import * as cheerio from 'cheerio';
import axios from 'axios';
import * as iconv from 'iconv-lite';
// const iconv = require('iconv-lite');
// import { join, dirname } from 'path';
import { Low, JSONFile } from 'lowdb';
// import { fileURLToPath } from 'url';

// const __dirname = dirname(fileURLToPath(import.meta.url));

// Use JSON file for storage
// const file = join(__dirname, 'db.json');
const file = './db.json';

type Data = {
  posts: string[];
};
const adapter = new JSONFile<Data>(file);
const db = new Low<Data>(adapter);

// Read data from JSON file, this will set db.data content
db.read().then(() => {
  // If file.json doesn't exist, db.data will be null
  // Set default data
  db.data ||= { posts: [] };
  // db.data = db.data || { posts: [] } // for node < v15.x

  // Create and query items using plain JS
  db.data.posts.push('hello world');
  db.data.posts[0];

  // You can also use this syntax if you prefer
  const { posts } = db.data;
  posts.push('hello world');

  // Write db.data content to db.json
  db.write().then(() => {
    console.log('db write complete.');
  });
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

// const html = await getHtml();
// if (html && html.data) {
//   // 네이버 뉴스 페이지의 경우 한글이 깨져서 아래와 같이 iconv 사용
//   const decodedStr = iconv.decode(html.data, 'euc-kr');
//   // const $ = cheerio.load(iconv.decode(html.data, 'euc-kr').toString());
//   const $ = cheerio.load(decodedStr);
//   const articleList = $('ul.newsList').children('li.block1');
//   const articles: { title: string; body: string; company: string; writeDate: string }[] = [];

//   articleList.each(function (i, el) {
//     let title = '';
//     if ($(this).find('dd.articleSubject').length > 0) {
//       title = $(this).find('dd.articleSubject > a').text().trim();
//     } else if ($(this).find('dt.articleSubject').length > 0) {
//       title = $(this).find('dt.articleSubject > a').text().trim();
//     }

//     articles.push({
//       title,
//       body: $(this)
//         .find('dd.articleSummary')
//         .contents()
//         .filter(function () {
//           return this.type === 'text';
//         })
//         .text()
//         .trim(),
//       company: $(this).find('dd.articleSummary > span.press').text().trim(),
//       writeDate: $(this).find('dd.articleSummary > span.wdate').text().trim(),
//     });
//   });

//   console.log(articles);
// }

getHtml().then(html => {
  if (html && html.data) {
    // 네이버 뉴스 페이지의 경우 한글이 깨져서 아래와 같이 iconv 사용
    // iconv.decode(html.data, 'euc-kr').toString();
    const $ = cheerio.load(iconv.decode(html.data, 'euc-kr').toString());
    const articleList = $('ul.newsList').children('li.block1');
    const articles: { title: string; body: string; company: string; writeDate: string }[] = [];

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

    console.log(articles);
  }
});
