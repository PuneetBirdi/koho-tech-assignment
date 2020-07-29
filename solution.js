'use strict';
const fs = require('fs');
const readline = require('readline');

//Function to convert the .txt input file into JSON objects by reading each line.
const validateLoad = async (path) => {
  //Read the file one line at a time
  const rl = readline.createInterface({
    //pass in the input as a stream refering to the input text file
    input: fs.createReadStream(path),
  });

  //await each line of the stream and evaluate if it meets parameters, write response accordingly
  for await (const line of rl) {
    //convert the line to JSON
    let transaction = JSON.parse(line);
    //remove the symbols sign from the load_amount and parseFloat for evaluation
    transaction = {
      ...transaction,
      load_amount: Number(transaction.load_amount.replace(/[^0-9.-]+/g, '')),
      time: new Date(transaction.time),
    };

    //evaluate the transaction with the evaluate() function and get result
    const result = await evaluate(transaction);

    //check result and write response
    if (result) {
      //if the load is accepted, write it to history.txt so following loads can be compared agains it
      writeTransaction(line);
      writeResponse(result, transaction);
    } else if (!result) {
      writeResponse(result, transaction);
    }
  }
};

//This function will evaluate the load against the prescribed limits, using the checkHistory function when the datastore needs to be referenced
const evaluate = async (transaction) => {
  //if the transaction is greater than 5000, reject
  if (transaction.load_amount > 5000) {
    return false;
    //return the response from withinLimits which will futher analyze the transaction against history
  } else {
    return await withinLimits(transaction);
  }
};

//check to see if customer history will allow for this transaction to be completed
const withinLimits = async (transaction) => {
  //destructure the transaction and extract load amount
  const { load_amount } = transaction;
  //get the records for this customer, destructure to seperate daily and weekly
  const { dailyRecord, weeklyRecord } = await checkHistory(transaction);

  //calculate the amount already loaded in this day
  const dailySum = dailyRecord.reduce(
    (acc, record) => acc + record.load_amount,
    0
  );
  //calculate the amount already loaded this week
  const weeklySum = weeklyRecord.reduce(
    (acc, record) => acc + record.load_amount,
    0
  );
  //if load breaches limits, return false
  if (
    dailyRecord.length >= 3 ||
    dailySum + load_amount > 5000 ||
    weeklySum + load_amount > 20000
  ) {
    return false;
  } else {
    return true;
  }
};

//this function returns an array of all transactions completed by the requesting customer
const checkHistory = async (transaction) => {
  //initiate empty customerHistory object with daily and weekly arrays
  const customerRecords = {
    dailyRecord: [],
    weeklyRecord: [],
  };

  if (!fs.existsSync('./history.txt')) {
    return customerRecords;
  }

  //create readline function
  const rl = readline.createInterface({
    //pass in the input as a stream refering to the histoy text file
    input: fs.createReadStream('./history.txt'),
  });

  //await each line of the stream and evaluate if it meets parameters, push to array or continue
  for await (const line of rl) {
    //convert the line to JSON
    let record = JSON.parse(line);
    //use regex to remove symbols to convert amount to number, and convert date string to date object
    record = {
      ...record,
      load_amount: Number(record.load_amount.replace(/[^0-9.-]+/g, '')),
      time: new Date(record.time),
    };

    //EVALUATE EACH RECORD
    //// if the record is within the same day as the transaction, push to customerRecord.dailyRecord
    if (
      record.customer_id === transaction.customer_id &&
      sameDay(record.time, transaction.time)
    ) {
      customerRecords.dailyRecord.push(record);
      // if the record is within the same week as the transaction, push to customerRecord.weeklyRecord
    } else if (
      record.customer_id === transaction.customer_id &&
      sameWeek(record.time, transaction.time)
    ) {
      customerRecords.weeklyRecord.push(record);
    } else {
      continue;
    }
  }
  //when all lines are read, return customer records
  return customerRecords;
};

//UTLITY FUNCTIONS ====================
//This function writes the accepted transaction to ./history.txt
const writeTransaction = (transaction) => {
  const logger = fs.createWriteStream('./history.txt', {
    flags: 'a', //This will append the file rather than re-writing the whole thing
  });
  //add '\n' to the transaction so that it's written in a new line
  const record = transaction + '\n';
  logger.write(record);
};

//write the response to output.txt
const writeResponse = (accepted, transaction) => {
  //build response object
  let response = {
    id: transaction.id,
    customer_id: transaction.customer_id,
    accepted: accepted,
  };
  const logger = fs.createWriteStream('./output.txt', {
    flags: 'a', //This will append the file rather than re-writing the whole thing
  });
  //stringify and add '\n' to the response so that it's written in a new line
  const record = JSON.stringify(response) + '\n';
  logger.write(record);
};

//check if two dates are the same day
const sameDay = (d1, d2) => {
  return (
    d1.getDate() === d2.getDate() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getFullYear() === d2.getFullYear()
  );
};

//check if two dates are within the same week
const sameWeek = (d1, d2) => {
  return d1.getWeek() === d2.getWeek();
};

//Create Date prototype method to return which ISO week of the year a date is in
Date.prototype.getWeek = function () {
  //get the year of the date passed in
  var onejan = new Date(this.getFullYear(), 0, 1);
  //get the current day
  var today = new Date(this.getFullYear(), this.getMonth(), this.getDate());
  var dayOfYear = (today - onejan + 86400000) / 86400000;
  return Math.ceil(dayOfYear / 7);
};

validateLoad('./input.txt');
