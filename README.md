# Smart Farming Lab

---

## Local Development
**1.** Run Docker First
````
    docker compose -f compose.dev.yml up --build
````
or
````
    docker compose -f compose.dev.yml up
````

**2.** Run Local BackEnd
````
    cd ./hydroponic_be/
    uv run fastapi dev
````

**3.** Run Local FrontEnd
````
    cd ./hydroponic_fe/
    npm install
    npm run dev
````
*note*: Please make sure you have downloaded uv, npm and docker

---

## Production Development
*on the way*
