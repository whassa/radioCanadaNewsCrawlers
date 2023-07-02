require('dotenv').config()
const { Worker }  = require('worker_threads');;
const axios = require('axios');
const cheerio = require('cheerio');
const { MongoClient, ServerApiVersion } = require('mongodb');

const url = "https://ici.radio-canada.ca/";


const getImageLinkFromElement = (elements) => {
    let mComplexPicture = elements[0]?.children;
    if ( mComplexPicture ) {
        for (let index = 0; index < mComplexPicture.length; index++) {
            if (mComplexPicture[index].attribs.class.includes('e-picture-render')) {
                let picture = mComplexPicture[index];
                return picture.children[0].children[0].attribs.srcset;
            }
        }
    }
}

const getTextFromHeader = (element) => {
    let name = undefined;
    for (let y = 0; y < element.children.length; y++) {
        if (element.children[y].attribs.class.includes('e-title')) {
            name = element.children[y].children[0].attribs['aria-label'];
        }
    }
    return name;
}


const getArticlesInformationFromElement = (element, region) => {
    let article = {};
    article.type = region;
    article.dateRetrieved = new Date();
    for (let index = 0; index < element.children.length; index++) {
        const children = element.children[index];
        switch( children.name ) {
            case 'a':
                article.link = url+children.attribs.href;
                break;
            case 'div':
                if (children.attribs.class.includes('container-image')) {
                    let containerImage = children.children;
                    let imageLink = getImageLinkFromElement(containerImage)
                    if (imageLink) article.imageLink = imageLink;
                }
                break;
            case 'section':
                if (children.attribs.class.includes('container-text')) {
                    let contentText =  children.children[0];
                    for (let index = 0; index < contentText.children.length; index++) {
                        if (contentText.children[index].name === 'header') {
                           article.name = getTextFromHeader(contentText.children[index]);
                        } else if (contentText.children[index].name === 'p') {
                           article.summary = contentText.children[index].children[0].data;
                        }
                    }
                }
        }

    }
    return article
}

const mainFunc = async () => {

    // fetch html data from iban website
    let res = await fetchData(url);
    if(!res.data){
        console.log("Invalid data Obj");
        return;
    }
    const html = res.data;

    const $ = cheerio.load(html);

    const articles = $('.main-col .national-lineup ul > li .container-main-card');

    const articlesArray = []

    articles.each( (index, element) => {
        articlesArray.push(getArticlesInformationFromElement(element, 'national'));
    })
    
    const regionalArticles = $('.main-col .regional-lineup ul > li .container-main-card');

    regionalArticles.each( (index, element) => {
        articlesArray.push(getArticlesInformationFromElement(element, 'regional'));
    })

    return articlesArray;
}

const fetchData = async (url) => {
    console.log("Crawling data...")

    // make http call to url
    let response = await axios(url).catch((err) => console.log(err));
    
    if(response.status !== 200){
        console.log("Error occurred while fetching data");
        return;
    }
    return response;

}

const client = new MongoClient(process.env.MONGO_DB_URL,  {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
}
);

const run = async () => {
    try {
      await client.connect();

      const articles =  await mainFunc();
      await client.db(process.env.MONGO_DB_NAME).collection(process.env.MONGO_DB_COLLECTION_NAME).insertMany(articles);

    } finally {
      await client.close();
    }
}
run().catch(console.dir);