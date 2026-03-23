class Post{
    #images
    #name
    #price
    #location
    #category
    #condition
    #status
    constructor(images, name, price, location, status, condition){
        this.#images = images //massive
        this.#name = name
        this.#category = category
        this.#price = price
        this.#location = location
        this.#condition = condition
        this.#status = status
    }

    getImages(){
        return this.#images
    }

    addImage(img){
        this.#images.push(img)
    }

    getName(){
        return this.#name
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
}

export { Post }