import _ from 'lodash'
const EaseNumbers = (() => {
	let VO = {
		value: 0,
		target: 0,
		easing: 0,
		setValue(v) {
			this.target = v;
		}
	};

	const _numbers = [];
	let _numbersLength;

	function addNew(mValue = 0, mEasing = 0.1) {
		let numVo = _.assign({}, VO);
		numVo.value = mValue;
		numVo.target = mValue;
		numVo.easing = mEasing;
		_numbers.push(numVo);
		_numbersLength = _numbers.length;
		return numVo;
	}

	function remove(obj){
		let _i = _numbers.indexOf(obj)
		_numbers.splice(_i, 1)
	}

	function update() {
		for (let i = 0; i < _numbersLength; i++) {
			if(_numbers[i]){
				_numbers[i].value += (_numbers[i].target - _numbers[i].value) * _numbers[i].easing;
			}
		}
	}

	return {
		addNew,
		remove,
		update
	};
})();

export default EaseNumbers