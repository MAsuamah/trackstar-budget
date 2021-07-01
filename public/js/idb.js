// create variable to hold db connection
let db;
// establish a connection to IndexedDB database called 'budget_tracker' and set it to version 1
const request = indexedDB.open('budget_tracker', 1);

request.onupgradeneeded = function(event) {
  const db = event.target.result;
  // create an object store (table) called `new_transact`, set it to have an auto incrementing primary key of sorts 
  db.createObjectStore('new_transact', { autoIncrement: true });
};

// upon a successful 
request.onsuccess = function(event) {

  db = event.target.result;

  // check if app is online, if yes run uploadTransact() function to send all local db data to api
  if (navigator.onLine) {
    uploadTransact();
  }
};

request.onerror = function(event) {
  // log error here
  console.log(event.target.errorCode);
};

// This function will be executed if we attempt to submit a new transaction and there's no internet connection
function saveRecord(record) {

  const transaction = db.transaction(['new_transact'], 'readwrite');

  // access the object store for `new_transact`
  const transactObjectStore = transaction.objectStore('new_transact');

  // add record to your store with add method
  transactObjectStore.add(record);
}

function uploadTransact() {
  // open a transaction on your db
  const transaction = db.transaction(['new_transact'], 'readwrite');

  // access your object store
  const transactObjectStore = transaction.objectStore('new_transact');

  // get all records from store and set to a variable
  const getAll = transactObjectStore.getAll();

  // upon a successful .getAll() execution, run this function
  getAll.onsuccess = function() {
    // if there was data in indexedDb's store, let's send it to the api server
    if (getAll.result.length > 0) {
      fetch('/api/transaction/bulk', {
        method: 'POST',
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Content-Type': 'application/json'
        }
      })
        .then(response => response.json())
        .then(serverResponse => {
          if (serverResponse.message) {
            throw new Error(serverResponse);
          }
          // open one more transaction
          const transaction = db.transaction(['new_transact'], 'readwrite');
          // access the new_transact object store
          const transactObjectStore = transaction.objectStore('new_transact');
          // clear all items in your store
          transactObjectStore.clear();

          alert('All saved transactions have been submitted!');
        })
        .catch(err => {
          console.log(err);
        });
    }
  };
}

// listen for app coming back online
window.addEventListener('online', uploadTransact);
