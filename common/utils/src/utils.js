const getSharedProperties = (props, items, obj) => {
  if (!Array.isArray(props)) {
    props = [props];
  }

  return props.filter(p => {
    if (Array.isArray(items)) {
      return items.findIndex(item => item[p] === obj[p]) !== -1;
    }

    return items[p] === obj[p];
  });
};

module.exports = {
  getSharedProperties,
};
