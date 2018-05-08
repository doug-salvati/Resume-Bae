# Resume-Bae
Block-based résumé editor for GUI II class

## How to install this web app

1. Clone the repo.
2. Install [Node](https://nodejs.org/en/).
3. Install [mongoDB](https://docs.mongodb.com/manual/administration/install-community/).
4. Run the mongoDB daemon (`mongod`).
5. Create a document `resumebae` from the mongoDB console to store users and their resumes.
6. Create an `EXPRESS_SESSION_SECRET` environment variable for managing user sessions, (e.g `export EXPRESS_SESSION_SECRET=abcdefg`).
7. Install the dependencies with `npm install`.
8. Start the server on port 3000 with `npm start`.
