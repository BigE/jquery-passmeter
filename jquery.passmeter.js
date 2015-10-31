(function ( $ ) {
	$.fn.passmeter = function ( options )
	{
		var settings = $.extend($.fn.passmeter.defaults, options),
			seqLetters = 'abcdefghijklmnopqrstuvwxyz', seqNumbers = '01234567890', seqSymbols = '!@#$%^&*()',
			passmeter = $('<div></div>').addClass('passmeter').append(
				$('<a></a>').attr('href', '#').addClass('passmeter_label').text('Password Strength:').click(function (event) {
					console.log('clicky', event);
					event.preventDefault();
					$(this).parent().find('.passmeter_rules').slideToggle();
				})
			).append(
				$('<span></span>').addClass('passmeter_strength').text('Too short')
			).append(
				$('<div></div>').addClass('passmeter_meter').append($('<div></div>').addClass('passmeter_inner'))
			).append(
				$('<div></div>').addClass('passmeter_rules').css('display', 'none').append(
					$('<ul></ul>').addClass('fa-ul').append(
						$('<li></li>').addClass('passmeter_min')
							.html('<i class="fa fa-li fa-circle-o"></i>Minimum {0} characters in length')
					).append(
						$('<li></li>').addClass('passmeter_required')
							.html('<i class="fa fa-li fa-circle-o"></i>Contains {1}/4 of the following items:')
							.append(
								$('<ul></ul>').addClass('fa-ul').append(
									$('<li></li>').addClass('passmeter_upper')
										.html('<i class="fa fa-li fa-circle-o"></i>Uppercase Letters')
								).append(
									$('<li></li>').addClass('passmeter_lower')
										.html('<i class="fa fa-li fa-circle-o"></i>Lowercase Letters')
								).append(
									$('<li></li>').addClass('passmeter_numbers')
										.html('<i class="fa fa-li fa-circle-o"></i>Numbers')
								).append(
									$('<li></li>').addClass('passmeter_symbols')
										.html('<i class="fa fa-li fa-circle-o"></i>Symbols')
								)
							)
					)
				)
			);

		if (settings.password == null) {
			window.console && console.error('cannot initialize password meter due to a missing selector');
			return this;
		}

		if (settings.confirm !== null) {
			$(passmeter).find('.passmeter_required').after(
				$('<li></li>').addClass('passmeter_confirm')
					.html('<i class="fa fa-li fa-circle-o"></i>Passwords Match')
			);
		}

		return this.each(function () {
			// create the meter for the first time run
			var score = $.extend(true, {}, $.fn.passmeter.score);
			$(this).append($(passmeter));
			$(this).find('.passmeter_rules').html($.fn.passmeter.format($(this).find('.passmeter_rules').html(), settings.min, settings.require));

			$(document).on({
				'focusin': function (event) {
					$.fn.passmeter.focusin(event, settings);
				},
				'focusout': function (event) {
					$.fn.passmeter.focusout(event, settings);
				}
			}, settings.password);

			if (settings.confirm !== null) {
				$(document).on({
					'focusin': function (event) {
						$.fn.passmeter.focusin(event, settings);
					},
					'focusout': function (event) {
						$.fn.passmeter.focusout(event, settings);
					}
				}, settings.confirm);
			}

			$(settings.password).keyup(function () {
				var total = 0, password = $(this).val();

				score.addition.len = password.length;
				score.addition.lower = $.fn.passmeter.match(/[a-z]/g, password);
				score.addition.upper = $.fn.passmeter.match(/[A-Z]/g, password);
				score.addition.numbers = $.fn.passmeter.match(/[0-9]/g, password);
				score.addition.middle = $.fn.passmeter.match(/[0-9!@#\$%\^&*(){}.,'"]/g, password.substr(1, (password.length - 2)));

				score.addition.symbols = $.fn.passmeter.match(/[!@#\$%\^&*()\{\}\.,'"]/g, password);
				score.subtraction.consecutive.lower = $.fn.passmeter.match(/[a-z]+/g, password, true);
				score.subtraction.consecutive.numbers = $.fn.passmeter.match(/[0-9]+/g, password, true);
				score.subtraction.consecutive.upper = $.fn.passmeter.match(/[A-Z]+/g, password, true);

				// checks for password being all of one type of char
				if (password.match(/^[a-z]+$/i))
					score.subtraction.letters = password.length;
				if (password.match(/^[0-9]+$/))
					score.subtraction.numbers = password.length;

				// look for repeats of chars, this needs to be more complex
				if ($.fn.passmeter.match(/(.)[^\1]*\1/, password)) {
					for (var orig = 0; orig < password.length; orig++) {
						var charExists = false;
						for (var inner = 0; inner < password.length; inner++) {
							if (password[orig] == password[inner] && orig != inner) {
								charExists = true;
								score.total.subtraction.repeat += Math.abs(password.length / (inner - orig));
							}
						}

						if (charExists) {
							score.subtraction.repeat += 1;
							var uniqueChar = (password.length - score.subtraction.repeat);
							score.total.subtraction.repeat = (uniqueChar)?
								Math.ceil(score.total.subtraction.repeat/uniqueChar)
								:
								Math.ceil(score.total.subtraction.repeat);
						}
					}
				}
				// now test for sequential
				score.subtraction.sequential.letters = score.subtraction.sequential.numbers = score.subtraction.sequential.symbols = 0;
				for (var x = 0; x < (seqLetters.length - 3); x++) {
					var abc = seqLetters.substr(x, 3), cba = abc.split('').reverse().join('');
					if (password.toLowerCase().indexOf(abc) != -1 || password.toLowerCase().indexOf(cba) != -1)
						score.subtraction.sequential.letters += 1;
				}
				for (var x = 0; x < (seqNumbers.length - 3); x++) {
					var abc = seqNumbers.substr(x, 3), cba = abc.split('').reverse().join('');
					if (password.indexOf(abc) != -1 || password.indexOf(cba) != -1) {
						score.subtraction.sequential.numbers += 1;
					}
				}
				for (var x = 0; x < (seqSymbols.length - 3); x++) {
					var abc = seqSymbols.substr(x, 3), cba = abc.split('').reverse().join('');
					if (password.indexOf(abc) != -1 || password.indexOf(cba) != -1)
						score.subtraction.sequential.symbols += 1;
				}

				score.addition.required = 0;

				if (score.addition.lower > 0) {
					score.addition.required += 1;
					$('.passmeter_lower > .fa').removeClass('fa-circle-o').addClass('fa-check-circle-o');
				} else {
					$('.passmeter_lower > .fa').removeClass('fa-check-circle-o').addClass('fa-circle-o');
				}

				if (score.addition.upper > 0) {
					score.addition.required += 1;
					$('.passmeter_upper > .fa').removeClass('fa-circle-o').addClass('fa-check-circle-o');
				} else {
					$('.passmeter_upper > .fa').removeClass('fa-check-circle-o').addClass('fa-circle-o');
				}

				if (score.addition.numbers > 0) {
					score.addition.required += 1;
					$('.passmeter_numbers > .fa').removeClass('fa-circle-o').addClass('fa-check-circle-o');
				} else {
					$('.passmeter_numbers > .fa').removeClass('fa-check-circle-o').addClass('fa-circle-o');
				}

				if (score.addition.symbols > 0) {
					score.addition.required += 1;
					$('.passmeter_symbols > .fa').removeClass('fa-circle-o').addClass('fa-check-circle-o');
				} else {
					$('.passmeter_symbols > .fa').removeClass('fa-check-circle-o').addClass('fa-circle-o');
				}

				if (password.length >= settings.min) {
					score.addition.required += 1;
					$('.passmeter_min > .fa').removeClass('fa-circle-o').addClass('fa-check-circle-o');
				} else {
					$('.passmeter_min > .fa').removeClass('fa-check-circle-o').addClass('fa-circle-o');
				}

				if (score.addition.required > settings.require) {
					$('.passmeter_required > .fa').removeClass('fa-circle-o').addClass('fa-check-circle-o');
				} else {
					$('.passmeter_required > .fa').removeClass('fa-check-circle-o').addClass('fa-circle-o');
				}

				total = $.fn.passmeter.total(score, settings.require);

				var meter = $(passmeter).find('.passmeter_meter'), label = $(passmeter).find('.passmeter_strength');
				$(meter).find('.passmeter_inner').css('width', total+'%');

				if (password.length < settings.min) {
					$(label).text('Too short');
					$(meter).attr('level', 'short');
				} else if (score.addition.required < settings.require) {
					$(label).text('Invaild password');
					$(meter).attr('level', 'short');
				} else if (total >= 0 && total <= 25) {
					$(label).text('Weak');
					$(meter).attr('level', 'weak');
				} else if (total > 25 && total <= 50) {
					$(label).text('Fair');
					$(meter).attr('level', 'fair');
				} else if (total > 50 && total <= 75) {
					$(label).text('Good');
					$(meter).attr('level', 'good');
				} else if (total > 0 && total < 100) {
					$(label).text('Strong');
					$(meter).attr('level', 'strong');
				} else {
					$(label).text('Strongest');
					$(meter).attr('level', 'strongest');
				}

				if (settings.callback && typeof(settings.callback) == 'function') {
					settings.callback.call(this, score, total);
				}
			}).keyup();
		});
	};

	$.fn.passmeter.focusin = function (event, settings) {
		console.log('focusin', event);
		if (event.isDefaultPrevented()) return;
		if ($(event.target).data('clicky') === true) {
			$(event.target).removeData('clicky');
		} else {
			if (settings.confirm && event.currentTarget !== null && event.relatedTarget !== null && (
					('#' + event.currentTarget.id === settings.password && '#' + event.relatedTarget.id === settings.confirm) ||
					('#' + event.currentTarget.id === settings.confirm && '#' + event.relatedTarget.id === settings.password)
				)
			) {
				return;
			}

			$('.passmeter_rules:hidden').slideDown();
		}
	};

	$.fn.passmeter.focusout = function (event, settings) {
		console.log('focusout', event);
		if (event.isDefaultPrevented()) return;
		if ($(event.relatedTarget).hasClass('passmeter_label')) {
			$(event.target).data('clicky', true).focus();
		} else {
			if (settings.confirm && event.currentTarget !== null && event.relatedTarget !== null && (
					('#' + event.currentTarget.id === settings.password && '#' + event.relatedTarget.id === settings.confirm) ||
					('#' + event.currentTarget.id === settings.confirm && '#' + event.relatedTarget.id === settings.password)
				)
			) {
				return;
			}

			$('.passmeter_rules:visible').slideUp();
		}
	};

	$.fn.passmeter.defaults = {
		callback: null,
		confirm: null,
		min: 6,
		password: null,
		require: 3
	};

	$.fn.passmeter.format = function(format) {
		var args = Array.prototype.slice.call(arguments, 1);
		return format.replace(/{(\d+)}/g, function(match, number) {
			return typeof args[number] != 'undefined'
				? args[number]
				: match
			;
		});
	};

	$.fn.passmeter.match = function (regex, string, iterate)
	{
		var m = string.match(regex);

		if (m) {
			if (iterate == true) {
				var total = 0;
				$.each(m, function () {
					total += (this.length - 1);
				});

				return total;
			}
			return m.length;
		}

		return 0;
	};

	$.fn.passmeter.score = {
		addition: {
			len: 0,
			lower: 0,
			middle: 0,
			numbers: 0,
			required: 0,
			symbols: 0,
			upper: 0
		},
		subtraction: {
			consecutive: {
				lower: 0,
				numbers: 0,
				upper: 0
			},
			sequential: {
				letters: 0,
				numbers: 0,
				symbols: 0
			},
			letters: 0,
			numbers: 0,
			repeat: 0
		},
		total: {
			addition: {
				len: 0,
				lower: 0,
				middle: 0,
				numbers: 0,
				required: 0,
				symbols: 0,
				upper: 0
			},
			subtraction: {
				consecutive: {
					lower: 0,
					numbers: 0,
					upper: 0
				},
				sequential: {
					letters: 0,
					numbers: 0,
					symbols: 0
				},
				letters: 0,
				numbers: 0,
				repeat: 0
			}
		}
	};

	$.fn.passmeter.total = function (score, required)
	{
		var total = 0;
		// first add
		if (!score.subtraction.letters || (score.subtraction.letters && score.addition.lower && score.addition.upper)) {
			total += score.total.addition.lower = ((score.addition.lower > 0) ? (score.addition.len - score.addition.lower) : 0) * 2;
			total += score.total.addition.upper = ((score.addition.upper > 0) ? (score.addition.len - score.addition.upper) : 0) * 2;
		} else {
			score.total.addition.lower = 0;
			score.total.addition.upper = 0;
		}

		if (!score.subtraction.numbers) {
			total += score.total.addition.numbers = score.addition.numbers * 4;
		} else {
			score.total.addition.numbers = 0;
		}

		total += score.total.addition.len = score.addition.len * 2;
		total += score.total.addition.middle = score.addition.middle * 2;
		total += score.total.addition.symbols = score.addition.symbols * 6;

		if (score.addition.required >= required)
			total += score.total.addition.required = score.addition.required * 2;

		// now subtract
		total -= score.total.subtraction.letters = score.subtraction.letters;
		total -= score.total.subtraction.numbers = score.subtraction.numbers;
		total -= score.total.subtraction.consecutive.lower = score.subtraction.consecutive.lower * 2;
		total -= score.total.subtraction.consecutive.numbers = score.subtraction.consecutive.numbers * 2;
		total -= score.total.subtraction.consecutive.upper = score.subtraction.consecutive.upper * 2;
		total -= score.total.subtraction.sequential.letters = score.subtraction.sequential.letters * 3;
		total -= score.total.subtraction.sequential.numbers = score.subtraction.sequential.numbers * 3;
		total -= score.total.subtraction.sequential.symbols = score.subtraction.sequential.symbols * 3;

		if (total > 100) total = 100;
		else if (total < 0) total = 0;

		return total;
	};
}(jQuery));
