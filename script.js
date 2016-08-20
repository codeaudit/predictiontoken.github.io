$(function () {
  $('body').on('click', '#address_submit', function (e) {
    e.preventDefault();
    $('#address_modal').modal('hide');
    bundle.Main.addAccount($('#address_addr').val(), $('#address_pk').val());
  });
});
$(function() {
  $('#clear-log').click(function(){
    $('#notifications').empty();
  });
});
$(function () {
  $('body').on('click', '#new_submit', function (e) {
    e.preventDefault();
    bundle.Main.deploy($('#new_reality_url').val(), $('#new_ethaddr').val(), $('#new_facthash').val());
  });
});
$(function () {
  $('body').on('click', '#other_coin_submit', function (e) {
    e.preventDefault();
    $('#other_coin_modal').modal('hide');
    bundle.Main.otherCoin($('#other_coin_addr').val(), $('#other_coin_name').val(), $('#other_coin_kind').val());
  });
});
$(function () {
  $('body').on('click', '#create_submit', function (e) {
    e.preventDefault();
    bundle.Main.create($('#create_amount').val());
  });
});
$(function () {
  $('body').on('click', '#redeem_submit', function (e) {
    e.preventDefault();
    bundle.Main.redeem($('#redeem_amount').val());
  });
});
