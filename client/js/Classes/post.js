class Post{
    #images
    #title
    #price
    #location
    #category
    #condition
    #status
    #description

    constructor(images, title, price, location, category, condition, status, description){
        this.#images = images
        this.#title = title
        this.#category = category
        this.#price = price
        this.#location = location
        this.#condition = condition
        this.#status = status
        this.#description = description
    }

    getImages(){
        return this.#images
    }

    addImage(img){
        this.#images.push(img)
    }

    getTitle(){
        return this.#title
    }

    getPrice(){
        return this.#price
    }

    getLocation(){
        return this.#location
    }

    getCategory(){
        return this.#category
    }

    getCondition(){
        return this.#condition
    }

    getStatus(){
        return this.#status
    }

    getDescription(){
        return this.#description
    }
}

export { Post }
