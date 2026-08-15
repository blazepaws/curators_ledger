# Curator's Ledger - A World of Warcraft planner for collectors

This is a website for World of Warcraft collectors (or anyone with a serious schedule.) to stay organized.
The project is written using the Next.js framework with a Postgres database as our data store.

## Contributing

This project comes with a devcontainer that you should be able to load up in VS Code with no issues.
This will create a database with a pre-configured test user and an alternative login path to skip authentication.

In the container, run `npm run dev` to start the nextjs host.
The website will be available on port 3000.

Don't feel shy to contribute, anything helps! 
Please use AI in moderation when contributing.
I will not review your 50000 line slop request.

## Deployment

The docker-compose deployment in this repository is geared towards my personal deployment on my server.
There's a proxy network an an nginx reverse proxy in front of the website that you can't see here.
If you want to test the production deployment you will have to either recreate this or change the deployment.

## AI disclosure

This project contains AI generated code. Critical parts are hand-written and all code is human-verified.
I try to keep it clean and organized. If you encounter bad code quality, please open an issue.

## License

This code is licensed under GNU AGPL license. 
All contributions are also licensed as such. See the LICENSE file for the full license.