from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

app = FastAPI()


# STATIC
app.mount(
    "/static",
    StaticFiles(directory="static"),
    name="static"
)


# TEMPLATES
templates = Jinja2Templates(
    directory="templates"
)


# HOME
@app.get("/")
def home(request: Request):

    return templates.TemplateResponse(
        "index.html",
        {"request": request}
    )