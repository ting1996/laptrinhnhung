/****************************************************************************
 * @file     main.c
 * @version  V3.00
 * $Revision: 10 $
 * $Date: 15/06/04 1:56p $
 * @brief
 *           Transmit and receive data in UART RS485 mode.
 *           This sample code needs to work with UART_RS485_Master.
 * @note
 * Copyright (C) 2011 Nuvoton Technology Corp. All rights reserved.
 *
 ******************************************************************************/
#include <stdio.h>
#include "NUC131.h"
#include <string.h>


#define PLL_CLOCK   50000000


#define IS_USE_RS485NMM   0      //1:Select NMM_Mode , 0:Select AAD_Mode
#define MATCH_ADDRSS1     0xC0
#define MATCH_ADDRSS2     0xA2
#define UNMATCH_ADDRSS1   0xB1
#define UNMATCH_ADDRSS2   0xD3


/*---------------------------------------------------------------------------------------------------------*/
/* Define functions prototype                                                                              */
/*---------------------------------------------------------------------------------------------------------*/
extern char GetChar(void);
void UART3_HANDLE(void);




volatile int32_t g_bWait = TRUE;
volatile int32_t g_OK = TRUE;
char* closed ="CLOSED";
int len_closed = 6;
int c_closed =0;
char* fail ="FAIL";
int len_fail = 4;
int c_fail =0;
char* error ="ERROR";
int len_error = 5;
int c_error =0;
char* ok ="OK\r\n";
int len_ok = 4;
int c_ok =0;
int i = 0;
char* send_string;
char buzzwho;
int len = 0;
char* setcookie ="+IPD,1:";
int len_setcookie = 7;
int c_setcookie = 0;
char cookie[150];
int len_cookie = 0;
volatile int32_t check_setcookie = FALSE;
volatile int32_t check_buzz = FALSE;
volatile int32_t check_closed = FALSE;
volatile int32_t check_error = FALSE;
volatile int32_t check_fail = FALSE;
/*---------------------------------------------------------------------------------------------------------*/
/* ISR to handle UART Channel 1 interrupt event                                                            */
/*---------------------------------------------------------------------------------------------------------*/
void TIMER_Set(TIMER_T *timer, uint32_t u32Usec)
{
    uint32_t u32Clk = TIMER_GetModuleClock(timer);
    uint32_t u32Prescale = 0;
    uint32_t u32Cmpr, u32NsecPerTick;

    // Clear current timer configuration/


    if(u32Clk <= 1000000)    // min delay is 1000 us if timer clock source is <= 1 MHz
    {
        if(u32Usec < 1000)
            u32Usec = 1000;
        if(u32Usec > 1000000)
            u32Usec = 1000000;
    }
    else
    {
        if(u32Usec < 100)
            u32Usec = 100;
        if(u32Usec > 1000000)
            u32Usec = 1000000;
    }

    if(u32Clk <= 1000000)
    {
        u32Prescale = 0;
        u32NsecPerTick = 1000000000 / u32Clk;
        u32Cmpr = (u32Usec * 1000) / u32NsecPerTick;
    }
    else
    {
        if(u32Clk > 64000000)
        {
            u32Prescale = 7;    // real prescaler value is 8
            u32Clk >>= 3;
        }
        else if(u32Clk > 32000000)
        {
            u32Prescale = 3;    // real prescaler value is 4
            u32Clk >>= 2;
        }
        else if(u32Clk > 16000000)
        {
            u32Prescale = 1;    // real prescaler value is 2
            u32Clk >>= 1;
        }

        if(u32Usec < 250)
        {
            u32Cmpr = (u32Usec * u32Clk) / 1000000;
        }
        else
        {
            u32NsecPerTick = 1000000000 / u32Clk;
            u32Cmpr = (u32Usec * 1000) / u32NsecPerTick;
        }
    }

    timer->TCMPR = u32Cmpr;
    

    // When system clock is faster than timer clock, it is possible timer active bit cannot set in time while we check it.
    // And the while loop below return immediately, so put a tiny delay here allowing timer start counting and raise active flag.
    
}
void UART3_IRQHandler(void)
{
		UART3_HANDLE();
}





void UART3_HANDLE()
{
	char u8InChar = 0xFF;
    uint32_t u32IntSts = UART3->ISR;
		
    if(u32IntSts & UART_ISR_RDA_INT_Msk)
    {

        /* Get all the input characters */
        while(UART_IS_RX_READY(UART3))
        {
            /* Get the character from UART Buffer */
            u8InChar = UART_READ(UART3);

            //send_string[j++]=u8InChar;
						printf("%c",u8InChar);
						if (check_setcookie)
						{
							buzzwho = u8InChar;
							check_setcookie=FALSE;
							check_buzz=TRUE;
						}
						if(u8InChar == setcookie[c_setcookie])
								{
									c_setcookie++;
									if(c_setcookie == len_setcookie)
									{
										check_setcookie = TRUE;
									}
								}
						else
								c_setcookie=0;
						if(u8InChar == fail[c_fail])
								{
									c_fail++;
									if(c_fail == len_fail)
									{
										check_fail = TRUE;
									}
								}
						else
								c_fail=0;
						if(u8InChar == error[c_error])
								{
									c_error++;
									if(c_error == len_error)
									{
										check_error = TRUE;
									}
								}
						else
								c_error=0;
						if(u8InChar == closed[c_closed])
								{
									c_closed++;
									if(c_closed == len_closed)
									{
										check_closed = TRUE;
									}
								}
						else
								c_closed=0;
						
						if(g_OK)
						{
							if(u8InChar == ok[c_ok])
							{
								c_ok++;
								if(c_ok == len_ok)
								{
									g_OK = FALSE;
								}
							}
							else
									c_ok=0;
						}
						
						
            

            /* Check if buffer full */
            
        }
        
    }

    if(u32IntSts & UART_ISR_THRE_INT_Msk)
    {
        
            if(i>=len-1)
						{
							g_bWait = FALSE;
							UART_DISABLE_INT(UART3, 0x00000002); 
						}
            while(UART_IS_TX_FULL(UART3));  // Wait Tx is not full to transmit data                           
            //UART_WRITE(UART3, send_string[i++]);
						UART3->THR = send_string[i++];
           
     }
}
void sendATcmd(char* ATcmd)
{
	i = 0;
	send_string = ATcmd;
	len = strlen(ATcmd);
	g_bWait = TRUE;
	UART_EnableInt(UART3, UART_IER_THRE_IEN_Msk);
	while (g_bWait);
	
}








void SYS_Init(void)
{
    /*---------------------------------------------------------------------------------------------------------*/
    /* Init System Clock                                                                                       */
    /*---------------------------------------------------------------------------------------------------------*/

    /* Enable Internal RC 22.1184MHz clock */
    CLK_EnableXtalRC(CLK_PWRCON_OSC22M_EN_Msk);

    /* Waiting for Internal RC clock ready */
    CLK_WaitClockReady(CLK_CLKSTATUS_OSC22M_STB_Msk);

    /* Switch HCLK clock source to Internal RC and HCLK source divide 1 */
    CLK_SetHCLK(CLK_CLKSEL0_HCLK_S_HIRC, CLK_CLKDIV_HCLK(1));

    /* Enable external XTAL 12MHz clock */
    CLK_EnableXtalRC(CLK_PWRCON_XTL12M_EN_Msk);

    /* Waiting for external XTAL clock ready */
    CLK_WaitClockReady(CLK_CLKSTATUS_XTL12M_STB_Msk);

    /* Set core clock as PLL_CLOCK from PLL */
    CLK_SetCoreClock(PLL_CLOCK);
		CLK_SetSysTickClockSrc(CLK_CLKSEL0_STCLK_S_HCLK_DIV2);

    /* Enable UART module clock */
    CLK_EnableModuleClock(UART0_MODULE);
		CLK_EnableModuleClock(UART3_MODULE);
		CLK_EnableModuleClock(TMR0_MODULE);
		CLK_EnableModuleClock(TMR1_MODULE);
		CLK_EnableModuleClock(TMR2_MODULE);
    CLK_EnableModuleClock(TMR3_MODULE);
    

    /* Select UART module clock source */
    CLK_SetModuleClock(UART0_MODULE, CLK_CLKSEL1_UART_S_HXT, CLK_CLKDIV_UART(1));
		CLK_SetModuleClock(UART3_MODULE, CLK_CLKSEL1_UART_S_HXT, CLK_CLKDIV_UART(1));
		CLK_SetModuleClock(TMR0_MODULE, CLK_CLKSEL1_TMR0_S_HCLK, 0);
		CLK_SetModuleClock(TMR1_MODULE, CLK_CLKSEL1_TMR1_S_HXT, 0);
		CLK_SetModuleClock(TMR2_MODULE, CLK_CLKSEL1_TMR2_S_HXT, 0);
		CLK_SetModuleClock(TMR3_MODULE, CLK_CLKSEL1_TMR3_S_HXT, 0);
    
    

    /*---------------------------------------------------------------------------------------------------------*/
    /* Init I/O Multi-function                                                                                 */
    /*---------------------------------------------------------------------------------------------------------*/

    /* Set GPB multi-function pins for UART0 RXD(PB.0) and TXD(PB.1) */
    /* Set GPB multi-function pins for UART1 RXD(PB.4), TXD(PB.5), nRTS(PB.6) and nCTS(PB.7) */

		SYS->GPA_MFP &= ~(SYS_GPA_MFP_PA2_Msk | SYS_GPA_MFP_PA3_Msk);
    SYS->GPB_MFP &= ~(SYS_GPB_MFP_PB0_Msk | SYS_GPB_MFP_PB1_Msk);

    SYS->GPB_MFP |= (SYS_GPB_MFP_PB0_UART0_RXD | SYS_GPB_MFP_PB1_UART0_TXD
                      );
		SYS->GPA_MFP |= (
										SYS_GPA_MFP_PA3_UART3_RXD | SYS_GPA_MFP_PA2_UART3_TXD
                      );
		SYS->ALT_MFP4|=(SYS_ALT_MFP4_PA3_UART3_RXD| SYS_ALT_MFP4_PA2_UART3_TXD);
}

unsigned char KEYS_PAD[4][4] ={'1', '2' , '3' , 'A',
                               '4' ,'5' , '6', 'B',
                               '7' ,'8' ,'9', 'C',
                               '*' , '0', '#' , 'D' };
void quetphim_Init(volatile uint32_t ** output,volatile uint32_t ** input)
{
		GPIO_SetMode(PE, BIT5, GPIO_PMD_OUTPUT);
		GPIO_SetMode(PA, BIT15, GPIO_PMD_OUTPUT);
		GPIO_SetMode(PA, BIT10, GPIO_PMD_OUTPUT);
		GPIO_SetMode(PA, BIT11, GPIO_PMD_OUTPUT);
	
    GPIO_SetMode(PA, BIT13, GPIO_PMD_INPUT);
		GPIO_SetMode(PA, BIT2, GPIO_PMD_INPUT);
		GPIO_SetMode(PB, BIT11, GPIO_PMD_INPUT);
		GPIO_SetMode(PA, BIT14, GPIO_PMD_INPUT);
	
		PF4 = 0;
		PF5 = 0;
		PA10 = 0;
		PA11 = 0;
	
		output[0] = &PA10;
		output[1] = &PA11;
		output[2]=	&PA15;
		output[3]=	&PE5;
		input[0] = &PB11;
		input[1] = &PA14;
		input[2]=	&PA13;
		input[3]=	&PA12;
}
unsigned char quetphim(volatile uint32_t ** output,volatile uint32_t ** input)
{
		
		PA10 = 0;
		PA11 = 0;
		PA15=0;
		PE5=0;
	
		PB11=1;
		PA14=1;
		PA13=1;
		PA12=1;
	
		TIMER_Delay(TIMER0, 2);
		if(*input[0] == 0||*input[1] == 0||*input[2] == 0||*input[3] == 0)
		{
			  TIMER_Delay(TIMER0, 1000);
				if(*input[0] == 0||*input[1] == 0||*input[2] == 0||*input[3] == 0)
			{
				for(int i = 0;i<4;i++)
				{
					for(int c = 0; c<4;c++)
					{
						*output[c] = 1;
						if(i==c)
							*output[c] = 0;
					}
					TIMER_Delay(TIMER0, 1000);
					for(int j = 0;j<4;j++)
					{
						if(*input[j]==0)
						{
							TIMER_SET_CMP_VALUE(TIMER1, 0xFFFFFF);
							while(*input[j]==0)
							{
								int u32DelayTime = TIMER_GetCounter(TIMER1) / 1000;
								if(u32DelayTime > 60)
									return KEYS_PAD[i][j];
							}
							int u32DelayTime = TIMER_GetCounter(TIMER1) / 1000;
							if(u32DelayTime < 50)
								return 'a';
						}
					}
				}
			}
		}
		return 'a';
}
void TMR3_IRQHandler()
{
	if(TIMER_GetIntFlag(TIMER3) == 1)
    {
	PB13=0;
		
	TIMER_DisableInt(TIMER3);
	printf("ok");
		}
}
void UART0_Init()
{
    /*---------------------------------------------------------------------------------------------------------*/
    /* Init UART                                                                                               */
    /*---------------------------------------------------------------------------------------------------------*/
    /* Reset UART0 module */
    SYS_ResetModule(UART0_RST);

    /* Configure UART0 and set UART0 Baudrate */
    UART_Open(UART0, 9600);
}
void UART3_Init()
{
    /*---------------------------------------------------------------------------------------------------------*/
    /* Init UART                                                                                               */
    /*---------------------------------------------------------------------------------------------------------*/
    /* Reset UART0 module */
    SYS_ResetModule(UART3_RST);

    /* Configure UART0 and set UART0 Baudrate */
    UART_Open(UART3, 9600);
}

/*---------------------------------------------------------------------------------------------------------*/
/* MAIN function                                                                                           */
/*---------------------------------------------------------------------------------------------------------*/
uint32_t count = 0;
int32_t main(void)
{

    /* Unlock protected registers */
    SYS_UnlockReg();

    /* Init System, peripheral clock and multi-function I/O */
    SYS_Init();

    /* Lock protected registers */
    SYS_LockReg();

    /* Init UART0 for printf */
    UART0_Init();
		UART3_Init();
    /* Init UART1 for testing */
    

    /*---------------------------------------------------------------------------------------------------------*/
    /* SAMPLE CODE                                                                                             */
    /*---------------------------------------------------------------------------------------------------------*/

 
		
    //UART_ENABLE_INT(UART0, (UART_IER_RDA_IEN_Msk | UART_IER_TOUT_IEN_Msk));

    printf("bat dau");
		
    //NVIC_EnableIRQ(UART02_IRQn);
		//UART0->FCR &=~0x00000100;
		//printf("AT+RST\r\n");
    //TIMER_Delay(TIMER0, 100000);
		volatile uint32_t **output=(volatile uint32_t **) malloc(4*sizeof(uint32_t));
		volatile uint32_t **input= (volatile uint32_t **) malloc(4*sizeof(uint32_t));
		
    quetphim_Init(output,input);
		char key;
		
		TIMER1->TCSR = TIMER_PERIODIC_MODE | (12 - 1);
    TIMER_SET_CMP_VALUE(TIMER1, 0xFFFFFF);
    TIMER_Start(TIMER1);
		TIMER2->TCSR = TIMER_PERIODIC_MODE | (12 - 1);
    TIMER_SET_CMP_VALUE(TIMER2, 0xFFFFFF);
    TIMER_Start(TIMER2);
		g_OK = FALSE;
		UART_ENABLE_INT(UART3, (UART_IER_RDA_IEN_Msk | UART_IER_TOUT_IEN_Msk));
		NVIC_EnableIRQ(UART3_IRQn);
		UART3->FCR &=~0x00000100;
		
		
		sendATcmd("AT+RST\r\n");
		count=0;
		while(count<5)
		{
			TIMER_Delay(TIMER0, 1000000);
			count++;
		}
		g_OK = TRUE;
		sendATcmd("AT+CWMODE=1\r\n");
		
		while(g_OK);
		g_OK = TRUE;
		sendATcmd("AT+CIPMUX=0\r\n");
		while(g_OK);
		g_OK = TRUE;
		
		reconnect:
		sendATcmd("AT+CWJAP=\"Linksys18651\",\"12345679\"\r\n");
		while(g_OK)
		{
			if(check_fail)
			{
				check_fail =FALSE;
				goto reconnect;
			}
		}
		g_OK = TRUE;
		
		rejoin:
		sendATcmd("AT+CIPSTART=\"TCP\",\"13.59.106.246\",8081\r\n");
		//sendATcmd("AT+CIPSTART=\"TCP\",\"www.anta.net\",80\r\n");
		while(g_OK)
		{
			if(check_error)
			{
				check_error =FALSE;
				TIMER_Delay(TIMER0, 10000);
				if(check_closed)
				{
					check_closed = FALSE;
					goto rejoin;
				}
				else
					goto reconnect;
			}		
		if(check_closed)
			{
				check_closed = FALSE;
				goto rejoin;
			}
		}
		g_OK = TRUE;
		
		TIMER_SET_CMP_VALUE(TIMER2, 0xFFFFFF);
		GPIO_SetMode(PB, BIT13, GPIO_PMD_OUTPUT);
		NVIC_EnableIRQ(TMR3_IRQn);
		PB13=0;
		
		while(1)
		{
			if(check_closed)
			{
				check_closed = FALSE;
				goto rejoin;
			}
			int u32DelayTime = TIMER_GetCounter(TIMER2) / 1000000;
			if (u32DelayTime > 3)
			{
				sendATcmd("AT+CIPSEND=");
				sendATcmd("1\r\n");
				while(g_OK);
				g_OK = TRUE;
				sendATcmd("q");
				while(g_OK);
				g_OK = TRUE;
				TIMER_SET_CMP_VALUE(TIMER2, 0xFFFFFF);
			}
			if(check_buzz)
			{
				PB13=1;
				check_buzz=FALSE;
				TIMER_ClearIntFlag(TIMER3);
				if(buzzwho =='r')
					TIMER_Set(TIMER3,500000);
				else
					TIMER_Set(TIMER3,100000);
				TIMER_Start(TIMER3);				
				TIMER_EnableInt(TIMER3);
				PB13=1;
			}
			key = quetphim(output,input);
			if(key == '2'||key == '4'||key == '6'||key == '8'||key =='5')
			{
				TIMER_SET_CMP_VALUE(TIMER2, 0xFFFFFF);
				if(key == '2')
					key ='w';
				if(key == '4')
					key ='a';
				if(key == '6')
					key ='d';
				if(key == '8')
					key ='s';
				if(key == '5')
					key ='f';
				sendATcmd("AT+CIPSEND=");
				sendATcmd("1\r\n");
				while(g_OK);
				g_OK = TRUE;
				sendATcmd(&key);
				while(g_OK);
				g_OK = TRUE;
			}
		}
}
