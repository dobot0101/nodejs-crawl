// ES6 or TypeScript:
import * as cheerio from 'cheerio';
import axios from 'axios';
import * as iconv from 'iconv-lite';

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

getHtml().then(html => {
  // 네이버 뉴스 페이지의 경우 한글이 깨져서 아래와 같이 iconv 사용
  const $ = cheerio.load(iconv.decode(html.data, 'euc-kr').toString());
  const articleList = $('ul.newsList').children('li.block1');
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

  console.log(articles);
});
