# radioCanadaNewsCrawlers
This is a webcrawler that gets the front page information of radio canada and then deploy it to a mongodb server where I could use it later.

### To run the code

Make a mongodb cluster where you can have the url

    MONGO_DB_URL="mongo db url here"
    MONGO_DB_NAME="mongo db databse name here "
    MONGO_DB_COLLECTION_NAME="mongo db article name here"

Then simply `npm install`

and run with node.

What I do is use it as a cron job everyday to keep track of some of the latest changes. 
