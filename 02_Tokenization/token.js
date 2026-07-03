import { get_encoding } from "tiktoken";

const encoderForGPT = get_encoding("gpt2");

const encodedString = encoderForGPT.encode(" X loves Y");

console.log("Tokens generated for the text are", encodedString);

const decodedStr = encoderForGPT.decode(encodedString);
console.log(new TextDecoder().decode(decodedStr));

// const encodedString2 = encoderForGPT.encode(" Shobhit loves X");
// console.log(encodedString2);
