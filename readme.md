# Split Chinese

Split Chinese into words.

This API is a tiny wrapper around [MandarinSpot](https://mandarinspot.com/annotate).

Please do not abuse this API or MandarinSpot.


Please also note that there is an official JS library you can use client side [https://mandarinspot.com/api](https://mandarinspot.com/api).


```shell
yarn install
yarn dev
```

Example usage:
```javascript
let response = await fetch("http://localhost:3000/?text=你好吗");

let data = await response.json();
console.log(data);
```