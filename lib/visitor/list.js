class ListVisitor {
  visit({ name }) {
    console.log('>>>', name);
    return new Promise(resolve => {
      setTimeout(() => resolve(name), 1000);
    });
  }
}

module.exports = ListVisitor;
