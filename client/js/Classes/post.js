class Post{
    #images
    #name
    #price
    #location
    #category
    constructor(images, name, price, location){
        this.#images = images //massive
        this.#name = name
         this.#category = category
        this.#price = price
        this.#location = location
       
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
}

export { Post }